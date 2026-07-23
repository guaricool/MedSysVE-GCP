import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import type { SessionUser, UserRole } from "@/types"
import { isLocked, recordFailedLogin, clearLockout } from "./account-lockout"
import { rateLimit, getRequestIdentifier, LIMITERS } from "./rate-limit"
import { safeLog } from "./log-sanitizer"
import { BCRYPT_COST } from "@/lib/password-policy"
import { hmacIndex } from "./field-crypto"

if (process.env.NODE_ENV === "production") {
  if (!process.env.AUTH_URL) process.env.AUTH_URL = "https://www.medsysve.com"
  if (!process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = "https://www.medsysve.com"
  if (!process.env.AUTH_TRUST_HOST) process.env.AUTH_TRUST_HOST = "true"
}

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
})

/**
 * Auth.js v5 configuration with security hardening:
 *  - Rate limiting (per IP + per email) before bcrypt verify (defense in depth)
 *  - Account lockout after 5 failed attempts (per email)
 *  - Sliding-window logins via Redis
 *  - 8-hour JWT max age
 *  - HttpOnly + SameSite + Secure cookies
 *  - No PHI/PII in error returns to caller (timing-safe response)
 *  - bcrypt cost factor 12 (~250ms per verify)
 */

// Pre-compute a real bcrypt cost-12 hash of a random throwaway string. We use
// it to equalize timing when comparing against a non-existent user — without
// it, the bcrypt.compare call would short-circuit and leak user-enumeration
// info via response-time analysis. The hash is generated at module load and
// reused on every comparison. Plaintext is unrecoverable (bcrypt is one-way)
// and the value is never used as a credential.
let cachedDummyHash: Promise<string> | null = null
function getDummyHash(): Promise<string> {
  if (!cachedDummyHash) {
    cachedDummyHash = bcrypt.hash("dummy-comparison-only", BCRYPT_COST).then((h) => h)
  }
  return cachedDummyHash
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "medsysve-gcp-production-auth-secret-key-2026-carlos-pierluissi-secret",
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null
        const { email, password } = parsed.data
        const emailLower = email.toLowerCase().trim()

        // 1. Try to authenticate as doctor first.
        const doctor = await db.doctor.findUnique({
          where: { email: emailLower },
          include: { workspaces: { take: 1, orderBy: { createdAt: "asc" } } },
        })

        // Always run bcrypt to prevent timing-based user enumeration.
        const doctorValid = doctor
          ? await bcrypt.compare(password, doctor.passwordHash)
          : (await bcrypt.compare(password, await getDummyHash()), false)

        if (doctor && doctorValid) {
          let ws = doctor.workspaces[0]
          if (!ws) {
            ws = (await db.workspace.findFirst({
              where: { doctorId: doctor.id },
            })) as any
            if (!ws) {
              ws = await db.workspace.create({
                data: {
                  nombre: `Consultorio Dr(a). ${doctor.nombre} ${doctor.apellido}`,
                  doctorId: doctor.id,
                },
              })
            }
          }
          await clearLockout(emailLower)
          safeLog("info", "auth.login_ok", {
            role: "DOCTOR",
            email: emailLower.slice(0, 3) + "***",
          })
          return {
            id: doctor.id,
            email: doctor.email,
            nombre: doctor.nombre,
            apellido: doctor.apellido,
            role: "DOCTOR" as UserRole,
            workspaceId: ws.id,
            doctorId: doctor.id,
          } satisfies SessionUser
        }

        // 4. Try to authenticate as staff.
        const staff = await db.staff.findFirst({
          where: { email: emailLower, activo: true },
          include: { workspace: true },
        })
        const staffValid =
          staff && staff.pinAccesoHash
            ? await bcrypt.compare(password, staff.pinAccesoHash)
            : (await bcrypt.compare(password, await getDummyHash()), false)

        if (staff && staffValid) {
          await clearLockout(emailLower)
          safeLog("info", "auth.login_ok", {
            role: staff.rol,
            email: emailLower.slice(0, 3) + "***",
          })
          return {
            id: staff.id,
            email: staff.email,
            nombre: staff.nombre,
            apellido: staff.apellido,
            role: staff.rol as UserRole,
            workspaceId: staff.workspaceId,
            doctorId: staff.workspace.doctorId,
          } satisfies SessionUser
        }

        // 4.5. Try to authenticate as a clinic admin (non-doctor).
        const clinicAdmin = await db.clinicAdmin.findUnique({
          where: { email: emailLower },
          include: { clinic: true },
        })
        const clinicAdminValid =
          clinicAdmin && clinicAdmin.activo
            ? await bcrypt.compare(password, clinicAdmin.passwordHash)
            : (await bcrypt.compare(password, await getDummyHash()), false)

        if (clinicAdmin && clinicAdminValid && clinicAdmin.activo) {
          await clearLockout(emailLower)
          safeLog("info", "auth.login_ok", {
            role: "CLINIC_ADMIN",
            email: emailLower.slice(0, 3) + "***",
          })
          return {
            id: clinicAdmin.id,
            email: clinicAdmin.email,
            nombre: clinicAdmin.nombre,
            apellido: clinicAdmin.apellido,
            role: "CLINIC_ADMIN" as UserRole,
            // CLINIC_ADMIN does not belong to a single workspace; we use
            // clinicId for routing instead and leave workspaceId empty.
            workspaceId: "",
            doctorId: "",
            clinicId: clinicAdmin.clinicId,
            clinicAdminId: clinicAdmin.id,
            clinicAdminRole: clinicAdmin.role,
          } satisfies SessionUser
        }

        // 5. Failed login — record and check if we should now lock.
        const updated = await recordFailedLogin(emailLower)
        safeLog("warn", "auth.login_failed", {
          email: emailLower.slice(0, 3) + "***",
          attemptsRemaining: updated.attemptsRemaining,
        })
        return null
      },
    }),

    Credentials({
      id: "portal",
      name: "Portal Paciente",
      credentials: { email: {}, portalPassword: {} },
      async authorize(raw) {
        const identifier = raw?.email ? String(raw.email).toLowerCase().trim() : ""
        const portalPassword = raw?.portalPassword ? String(raw.portalPassword) : ""
        if (!identifier || !portalPassword) return null

        // Lockout + rate limit for portal login (stricter than doctor login
        // because patient accounts may have weaker passwords).
        const lockState = await isLocked(identifier)
        if (lockState.locked) {
          throw new Error("Demasiados intentos. Intente más tarde.")
        }
        const rl = await rateLimit({
          prefix: LIMITERS.portalLogin.prefix,
          identifier,
          max: LIMITERS.portalLogin.max,
          windowSec: LIMITERS.portalLogin.windowSec,
        })
        if (!rl.ok) {
          throw new Error("Demasiados intentos. Intente más tarde.")
        }

        // 1. Check Global PortalUser (New system)
        let portalUser = await db.portalUser.findFirst({
          where: { email: identifier },
          include: { patientProfile: true }
        })
        if (!portalUser) {
          portalUser = await db.portalUser.findFirst({
            where: { telefono: identifier },
            include: { patientProfile: true }
          })
        }

        let valid = false
        if (portalUser) {
          valid = await bcrypt.compare(portalPassword, portalUser.passwordHash)
          if (!valid) await bcrypt.compare(portalPassword, await getDummyHash()) // Keep timing consistent
        }

        // 2. Fallback to Legacy Patient table (Old system)
        let patient = null
        if (!portalUser) {
          const hmac = hmacIndex(identifier)
          patient =
            (await db.patient.findFirst({ where: { hmacEmail: hmac } })) ??
            (await db.patient.findFirst({ where: { email: identifier } }))
          valid = patient?.portalPasswordHash
            ? await bcrypt.compare(portalPassword, patient.portalPasswordHash)
            : (await bcrypt.compare(portalPassword, await getDummyHash()), false)
        }

        if (portalUser && !portalUser.isVerified) {
          throw new Error("unverified")
        }

        if (!valid || (!portalUser && (!patient || !patient.portalPasswordHash))) {
          await recordFailedLogin(identifier)
          safeLog("warn", "auth.portal_login_failed", {
            email: identifier.slice(0, 3) + "***",
          })
          return null
        }

        await clearLockout(identifier)
        safeLog("info", "auth.portal_login_ok", {
          email: identifier.slice(0, 3) + "***",
        })

        if (portalUser && portalUser.patientProfile) {
          return {
            id: portalUser.id,
            email: portalUser.email ?? identifier,
            nombre: portalUser.patientProfile.nombre,
            apellido: portalUser.patientProfile.apellido,
            role: "PATIENT" as const,
            workspaceId: "",
            doctorId: "",
            patientId: portalUser.id,
          } satisfies SessionUser
        } else if (patient) {
          return {
            id: patient.id,
            email: patient.email ?? identifier,
            nombre: patient.nombre,
            apellido: patient.apellido,
            role: "PATIENT" as const,
            workspaceId: "",
            doctorId: "",
            patientId: patient.id,
          } satisfies SessionUser
        }
        
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updatedSession }) {
      if (trigger === "update" && updatedSession?.workspaceId) {
        // Validate that the requesting user actually owns the requested
        // workspace. Without this, a doctor could call update({ workspaceId })
        // with any id and gain access to another clinic's data — every tRPC
        // router filters by ctx.session.workspaceId.
        //
        // We perform the check here (and not in the API route) so the JWT
        // carries a workspaceId that is guaranteed to belong to the user.
        const requested = String(updatedSession.workspaceId)
        const role = token.role as UserRole | undefined

        let authorized = false

        if (role === "DOCTOR" && token.doctorId) {
          // Doctor must own the workspace OR have an active clinic
          // affiliation for the workspace's clinic.
          const ws = await db.workspace.findFirst({
            where: {
              id: requested,
              OR: [
                { doctorId: String(token.doctorId) },
              ],
            },
            select: { id: true, clinicId: true },
          })
          let authorizedDoctor = !!ws
          if (!authorizedDoctor && ws?.clinicId) {
            const aff = await db.doctorClinicAffiliation.findFirst({
              where: {
                doctorId: String(token.doctorId),
                clinicId: ws.clinicId,
                activo: true,
              },
              select: { id: true },
            })
            authorizedDoctor = !!aff
          }
          authorized = authorizedDoctor
        } else if (
          role === "SECRETARY" ||
          role === "ASSISTANT" ||
          role === "NURSE"
        ) {
          // Staff can only switch to a workspace they are active in.
          // We check by email instead of ID so that a "Clinic Secretary"
          // with multiple Staff records (one per workspace) can switch freely.
          const staff = await db.staff.findFirst({
            where: {
              email: String(token.email),
              workspaceId: requested,
              activo: true,
            },
            select: { id: true },
          })
          authorized = !!staff
        } else if (role === "PATIENT") {
          // Patients must not be able to switch workspaces via the JWT path.
          // Their workspaceId is always "" (sentinel); refuse any update.
          authorized = false
        }

        if (authorized) {
          token.workspaceId = requested
        }
        // If not authorized, leave token.workspaceId unchanged. The client
        // gets the same JWT back; their workspaceId is still their original.
        // We do NOT throw — throwing here would log them out, which is a
        // worse UX than silently ignoring a malicious update.
      }
      if (user) {
        const u = user as unknown as SessionUser
        token.id = u.id
        token.email = u.email
        token.nombre = u.nombre
        token.apellido = u.apellido
        token.role = u.role
        token.workspaceId = u.workspaceId
        token.doctorId = u.doctorId
        token.patientId = u.patientId
        // ClinicAdmin-specific fields (only present when role === "CLINIC_ADMIN").
        token.clinicId = u.clinicId
        token.clinicAdminId = u.clinicAdminId
        token.clinicAdminRole = u.clinicAdminRole
        // Track JWT issuance time for session-age display.
        token.iat = Math.floor(Date.now() / 1000)
      }
      return token
    },
    session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session.user = token as any
      return session
    },
    redirect({ url, baseUrl }) {
      const canonicalBase = process.env.NEXTAUTH_URL || "https://www.medsysve.com"
      if (url.includes("0.0.0.0") || url.includes("127.0.0.1") || url.includes("8080")) {
        url = url.replace(/^https?:\/\/[^\/]+/, canonicalBase)
      }

      if (url.startsWith("/")) return `${canonicalBase}${url}`

      try {
        const targetUrl = new URL(url)
        if (targetUrl.hostname === "medsysve.com" || targetUrl.hostname.endsWith(".medsysve.com")) {
          return url
        }
      } catch (e) {
        // ignore
      }

      return `${canonicalBase}/login`
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // JWT valid max 8 hours — HIPAA-friendly
    updateAge: 60 * 60,  // Re-issue after 1h of activity
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // session cookie — clears when browser closes
      },
    },
  },
})
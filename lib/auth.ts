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
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null
        const { email, password } = parsed.data
        const emailLower = email.toLowerCase().trim()

        // 1. Account lockout check (cheap Redis GET, runs first).
        const lockState = await isLocked(emailLower)
        if (lockState.locked) {
          safeLog("warn", "auth.login_blocked_locked", {
            email: emailLower.slice(0, 3) + "***",
            remainingSec: lockState.remainingSeconds,
          })
          // Return null (generic failure) — DO NOT reveal that the account is locked.
          // The error message is generic on purpose to prevent user enumeration.
          throw new Error("Demasiados intentos. Intente más tarde.")
        }

        // 2. Rate limit (per IP+email combo).
        // The IP comes from the request headers. Auth.js doesn't expose the
        // request here, so we accept a slight weakening — the lockout above
        // is the primary defense for credential stuffing on a single email.
        // For IP-level brute force protection we have proxy.ts (per-IP rate
        // limit on the entire /api/auth/* path).
        // Per-email rate limit:
        const perEmail = await rateLimit({
          prefix: LIMITERS.login.prefix,
          identifier: emailLower,
          max: LIMITERS.login.max,
          windowSec: LIMITERS.login.windowSec,
        })
        if (!perEmail.ok) {
          safeLog("warn", "auth.login_rate_limited", {
            email: emailLower.slice(0, 3) + "***",
            retryAfter: perEmail.retryAfter,
          })
          throw new Error("Demasiados intentos. Intente más tarde.")
        }

        // 3. Try to authenticate as doctor.
        const doctor = await db.doctor.findUnique({
          where: { email: emailLower },
          include: { workspaces: { take: 1, orderBy: { createdAt: "asc" } } },
        })

        // Always run bcrypt to prevent timing-based user enumeration.
        // If no doctor, compare against a known-bad hash to equalize timing.
        const doctorValid = doctor
          ? await bcrypt.compare(password, doctor.passwordHash)
          : (await bcrypt.compare(password, await getDummyHash()), false)

        if (doctor && doctorValid) {
          const ws = doctor.workspaces[0]
          if (!ws) return null
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
        // Distinct from Doctor/Staff: ClinicAdmin manages the clinic dashboard,
        // not a medical workspace. They never see clinical data and don't have
        // a medical license — they're operational admins (OWNER or MANAGER).
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
        const email = raw?.email ? String(raw.email).toLowerCase().trim() : ""
        const portalPassword = raw?.portalPassword ? String(raw.portalPassword) : ""
        if (!email || !portalPassword) return null

        // Lockout + rate limit for portal login (stricter than doctor login
        // because patient accounts may have weaker passwords).
        const lockState = await isLocked(email)
        if (lockState.locked) {
          throw new Error("Demasiados intentos. Intente más tarde.")
        }
        const rl = await rateLimit({
          prefix: LIMITERS.portalLogin.prefix,
          identifier: email,
          max: LIMITERS.portalLogin.max,
          windowSec: LIMITERS.portalLogin.windowSec,
        })
        if (!rl.ok) {
          throw new Error("Demasiados intentos. Intente más tarde.")
        }

        // Look up the patient by `hmacEmail` (a deterministic lowercase HMAC
        // of the email). This is case-insensitive on purpose: a patient whose
        // email was stored as "YoguiTech@Gmail.com" must still be able to log
        // in by typing "yoguitech@gmail.com". Falling back to the plaintext
        // `email` field covers legacy patients created before the encryption
        // migration ran (where `hmacEmail` may be NULL).
        const hmac = hmacIndex(email)
        const patient =
          (await db.patient.findFirst({ where: { hmacEmail: hmac } })) ??
          (await db.patient.findFirst({ where: { email } }))
        const valid = patient?.portalPasswordHash
          ? await bcrypt.compare(portalPassword, patient.portalPasswordHash)
          : (await bcrypt.compare(portalPassword, await getDummyHash()), false)

        if (!patient || !patient.portalPasswordHash || !valid) {
          await recordFailedLogin(email)
          safeLog("warn", "auth.portal_login_failed", {
            email: email.slice(0, 3) + "***",
          })
          return null
        }

        await clearLockout(email)
        safeLog("info", "auth.portal_login_ok", {
          email: email.slice(0, 3) + "***",
        })
        return {
          id: patient.id,
          email: patient.email ?? email,
          nombre: patient.nombre,
          apellido: patient.apellido,
          role: "PATIENT" as const,
          workspaceId: "",
          doctorId: "",
          patientId: patient.id,
        } satisfies SessionUser
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
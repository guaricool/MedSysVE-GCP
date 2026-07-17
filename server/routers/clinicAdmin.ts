import { router, publicProcedure, clinicAdminProcedure } from "../trpc"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { TRPCError } from "@trpc/server"
import { hashPassword, strongPasswordSchema } from "@/lib/password-policy"
import { rateLimit, LIMITERS } from "@/lib/rate-limit"
import { safeLog } from "@/lib/log-sanitizer"
import { headers } from "next/headers"
import { loadAllLegalDocs } from "@/lib/legal/load-legal"
import { encryptField } from "@/lib/field-crypto"
import { verifyVerifiedToken } from "@/lib/otp"
import { generateClinicInvitationCode } from "@/lib/clinic-invitation-code"

// ---------------------------------------------------------------------------
// ClinicAdmin router
// ---------------------------------------------------------------------------
//
// Manages non-doctor administrators of a Clinic. Distinct from `doctor.ts`:
//   - `doctor.register` creates a Doctor record (medical license + clinical data).
//   - `clinicAdmin.register` creates a Clinic + ClinicAdmin (operational admin).
//
// Architecture (Carlos 2026-06-27):
//   1. ClinicAdmin registers → creates Clinic + OWNER ClinicAdmin in a transaction.
//   2. Doctors join the clinic separately via invitation code (doctor.register
//      with clinicInvitationCode). First 2 doctors are included in the clinic
//      subscription; doctor 3+ are extras.
//   3. ClinicAdmin can later add MANAGER ClinicAdmins via `addManager`.
//   4. ClinicAdmin can add Staff (secretaries/assistants/nurses) — but Staff
//      belongs to a specific Workspace owned by a Doctor, NOT to the Clinic
//      directly. So Staff management is delegated to the Doctors via the
//      existing `staffRouter` once they're in.
// ---------------------------------------------------------------------------

const consentSchema = z.object({
  terminos: z.boolean().refine((v) => v === true, "Debes aceptar los Términos y Condiciones"),
  privacidad: z.boolean().refine((v) => v === true, "Debes aceptar la Política de Privacidad"),
  lopdp: z.boolean().refine((v) => v === true, "Debes aceptar el Consentimiento LOPDP"),
  cookies: z.boolean().default(false),
})

/**
 * Helper used in multiple procedures: load the clinic with its admins + the
 * doctor count (used for billing preview).
 *
 * - `doctorCount`: COUNT(DoctorClinicAffiliation WHERE activo=true AND clinicId)
 *   These are the doctors who have joined the clinic (via invitation code).
 * - `includedSeats`: min(doctorCount, 2) — the first 2 are included in the
 *   clinic subscription ($60/mes).
 * - `extraSeats`: max(doctorCount - 2, 0) — additional doctors are charged
 *   as extras ($15/mes each when Stripe is wired end-to-end).
 */
async function loadClinicWithSummary(ctx: { db: any }, clinicId: string) {
  const clinic = await ctx.db.clinic.findUnique({
    where: { id: clinicId },
    include: {
      clinicAdmins: {
        where: { activo: true },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          role: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      },
      invitationCodes: {
        select: {
          id: true,
          code: true,
          used: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })
  if (!clinic) return null

  const doctorCount = await ctx.db.doctorClinicAffiliation.count({
    where: { clinicId, activo: true },
  })

  return {
    clinic,
    doctorCount,
    includedSeats: Math.min(doctorCount, 2),
    extraSeats: Math.max(doctorCount - 2, 0),
  }
}

export const clinicAdminRouter = router({
  /**
   * Register a new clinic + its OWNER ClinicAdmin in a single transaction.
   *
   * Input shape mirrors what a clinic owner would fill in /register:
   *   - Admin personal info (nombre, apellido, email, password, telefono)
   *   - Clinic info (nombre, rif, razón social, dirección, website,
   *     estado, ciudad)
   *
   * Side effects:
   *   - Creates the Clinic with an auto-generated invitationCode.
   *   - Creates the OWNER ClinicAdmin row.
   *   - Records LOPDP consent (4 ConsentAcceptance rows for the legal docs).
   *   - The clinic is NOT subscribed to Stripe yet — that happens in a
   *     separate `createCheckoutSession` call after registration completes.
   *
   * Rate limited: 3 registrations / hour / IP (same as doctor.register).
   * OTP-verified: the verifiedToken proves the user controls the email inbox.
   */
  register: publicProcedure
    .input(
      z.object({
        // ─── Admin personal info ───
        nombre: z.string().min(2).max(80).regex(/^[\p{L}\s\-']+$/u, "Solo letras y espacios"),
        apellido: z.string().min(2).max(80).regex(/^[\p{L}\s\-']+$/u, "Solo letras y espacios"),
        email: z.string().email().max(254),
        password: strongPasswordSchema,
        telefono: z.string().regex(/^[\d\s+\-()]{7,20}$/).optional(),
        // ─── Clinic info ───
        clinicNombre: z.string().min(2).max(120),
        clinicRif: z.string().max(20).optional(),
        clinicRazonSocial: z.string().max(200).optional(),
        clinicDireccion: z.string().max(250).optional(),
        clinicTelefono: z.string().max(40).optional(),
        clinicWebsite: z.string().url().max(300).optional(),
        clinicEstado: z.string().min(2).max(60),
        clinicCiudad: z.string().min(2).max(80),
        // ─── Legal ───
        consent: consentSchema,
        verifiedToken: z.string().min(20).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Per-IP rate limit (same as doctor.register).
      const hdrs = await headers()
      const ip =
        hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        hdrs.get("x-real-ip") ??
        "unknown"
      const rl = await rateLimit({
        prefix: LIMITERS.register.prefix,
        identifier: ip,
        max: LIMITERS.register.max,
        windowSec: LIMITERS.register.windowSec,
      })
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Demasiados registros desde esta IP. Intente más tarde.",
        })
      }

      // Verify OTP token.
      const claims = verifyVerifiedToken(input.verifiedToken)
      if (
        !claims.ok ||
        claims.claims.purpose !== "EMAIL_VERIFY" ||
        claims.claims.email !== input.email.toLowerCase().trim()
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Debes verificar tu correo electrónico antes de registrarte. Solicita un nuevo código.",
        })
      }

      const emailLower = input.email.toLowerCase().trim()

      // Reject duplicates (email already in use by a ClinicAdmin).
      const existingAdmin = await ctx.db.clinicAdmin.findUnique({
        where: { email: emailLower },
      })
      if (existingAdmin) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe un administrador de clínica registrado con ese correo.",
        })
      }

      const passwordHash = await hashPassword(input.password)
      safeLog("info", "clinicAdmin.register_attempt", {
        email: emailLower.slice(0, 3) + "***",
        ip: ip.slice(0, 8) + "***",
      })

      try {
        const legalDocs = await loadAllLegalDocs()
        const legalVersionRecords = await Promise.all(
          legalDocs.map(async (d) => {
            const existing = await ctx.db.legalVersion.findUnique({
              where: { slug_version: { slug: d.slug, version: d.version } },
            })
            if (existing) return existing
            return ctx.db.legalVersion.create({
              data: {
                slug: d.slug,
                version: d.version,
                title: d.title,
                contentHash: d.contentHash,
                effectiveAt: d.effectiveAt,
              },
            })
          }),
        )
        const versionBySlug = new Map(legalVersionRecords.map((v) => [v.slug, v]))

        const result = await ctx.db.$transaction(async (tx) => {
          // 1. Create the Clinic with an auto-generated invitation code.
          const clinic = await tx.clinic.create({
            data: {
              nombre: input.clinicNombre,
              nombreCifrado: encryptField(input.clinicNombre),
              rif: input.clinicRif ?? null,
              razonSocial: input.clinicRazonSocial ?? null,
              razonSocialCifrada: encryptField(input.clinicRazonSocial ?? null),
              direccion: input.clinicDireccion ?? null,
              direccionCifrada: encryptField(input.clinicDireccion ?? null),
              telefono: input.clinicTelefono ?? null,
              telefonoCifrado: encryptField(input.clinicTelefono ?? null),
              email: emailLower,
              emailCifrado: encryptField(emailLower),
              website: input.clinicWebsite ?? null,
              estado: input.clinicEstado,
              ciudad: input.clinicCiudad,
              activa: true,
            },
          })

          // 1.5 Generate 2 invitation codes for this clinic
          const codes = [
            generateClinicInvitationCode(),
            generateClinicInvitationCode()
          ]
          await tx.clinicInvitationCode.createMany({
            data: codes.map(code => ({ clinicId: clinic.id, code }))
          })

          // 2. Create the OWNER ClinicAdmin.
          // Enforce: only one OWNER per clinic. (Application-level guard —
          // there's no DB partial unique on this enum.)
          const existingOwner = await tx.clinicAdmin.findFirst({
            where: { clinicId: clinic.id, role: "OWNER" },
          })
          if (existingOwner) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Esta clínica ya tiene un administrador OWNER. Contacta al equipo de soporte.",
            })
          }
          const admin = await tx.clinicAdmin.create({
            data: {
              email: emailLower,
              passwordHash,
              nombre: input.nombre,
              apellido: input.apellido,
              telefono: input.telefono,
              role: "OWNER",
              clinicId: clinic.id,
              activo: true,
            },
          })

          // 3. Record LOPDP consent.
          const acceptances = [
            { slug: "terminos", accepted: input.consent.terminos },
            { slug: "privacidad", accepted: input.consent.privacidad },
            { slug: "cookies", accepted: input.consent.cookies },
            { slug: "lopdp-consentimiento", accepted: input.consent.lopdp },
          ]
          for (const a of acceptances) {
            if (!a.accepted) continue
            const lv = versionBySlug.get(a.slug)
            if (!lv) continue
            await tx.consentAcceptance.create({
              data: {
                doctorId: admin.id, // re-using the column for admin consent — see note below
                legalVersionId: lv.id,
                slug: a.slug,
                version: lv.version,
                ip: ip.slice(0, 8) + "***",
                userAgent: hdrs.get("user-agent")?.slice(0, 500) ?? null,
                explicit: true,
              },
            })
          }
          // NOTE on reusing ConsentAcceptance.doctorId: this is a temporary
          // shortcut — ClinicAdmin doesn't have a dedicated ConsentAcceptance
          // table yet. We record the ClinicAdmin.id in the doctorId column
          // (it's just a string FK). When ClinicAdmin consent reporting becomes
          // a product requirement, we'll add a proper `clinicAdminId` column
          // and migrate. The existing column allows `cuid()` strings.
          //
          // For the legal record itself, the slug+version+contentHash is
          // already on LegalVersion, so the consent is traceable.

          return { clinicId: clinic.id, adminId: admin.id, invitationCodes: codes }
        })

        safeLog("info", "clinicAdmin.registered", {
          clinicId: result.clinicId,
          adminId: result.adminId,
        })

        return result
      } catch (e: unknown) {
        if (
          typeof e === "object" &&
          e !== null &&
          "code" in e &&
          (e as { code: string }).code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe un administrador o clínica con esos datos.",
          })
        }
        throw e
      }
    }),

  /**
   * Return the admin's clinic + doctor count + admin roster. Used by the
   * clinic dashboard landing + the subscription card.
   */
  myClinic: clinicAdminProcedure.query(async ({ ctx }) => {
    const data = await loadClinicWithSummary(ctx, ctx.clinicId)
    if (!data) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Clínica no encontrada" })
    }
    // Strip the encrypted *Cifrado fields from the response (not needed by
    // the dashboard and would leak encryption noise to the client).
    const { nombreCifrado: _n, ...clinicRest } = data.clinic as any
    return {
      ...clinicRest,
      doctorCount: data.doctorCount,
      includedSeats: data.includedSeats,
      extraSeats: data.extraSeats,
    }
  }),

  /**
   * Return the admin's own ClinicAdmin row + role. Used by the dashboard
   * header to render the admin's role badge (OWNER vs MANAGER).
   */
  myAdmin: clinicAdminProcedure.query(async ({ ctx }) => {
    return ctx.db.clinicAdmin.findUnique({
      where: { id: ctx.session.clinicAdminId! },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        clinicId: true,
      },
    })
  }),

  /**
   * List doctors currently affiliated with the admin's clinic (used in the
   * clinic dashboard to show who's in + which seats are extra).
   */
  listDoctors: clinicAdminProcedure.query(async ({ ctx }) => {
    return ctx.db.doctorClinicAffiliation.findMany({
      where: { clinicId: ctx.clinicId, activo: true },
      include: {
        doctor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            especialidadPrincipal: true,
            workspaces: {
              select: {
                id: true,
                nombre: true,
                estado: true,
                ciudad: true,
              },
              take: 1,
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })
  }),

  /**
   * Rotate a clinic's invitation code. Useful when the OWNER suspects the
   * code leaked. This will mark the old code as used/invalid or delete it,
   * and create a new one. (Simplified here to just create a new one, but we
   * will need an ID to know which of the 2 codes to rotate).
   */
  rotateInvitationCode: clinicAdminProcedure
    .input(z.object({ codeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
    if (ctx.session.clinicAdminRole !== "OWNER") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Solo el administrador OWNER puede rotar el código de invitación.",
      })
    }
    // Delete old code and create a new one
    await ctx.db.clinicInvitationCode.delete({
       where: { id: input.codeId, clinicId: ctx.clinicId }
    })
    const newCode = await ctx.db.clinicInvitationCode.create({
      data: {
        clinicId: ctx.clinicId,
        code: generateClinicInvitationCode()
      }
    })
    safeLog("info", "clinicAdmin.rotated_invitation_code", {
      clinicId: ctx.clinicId,
      adminId: ctx.session.clinicAdminId,
      newCode: newCode.code
    })
    return newCode
  }),

  /**
   * Add a MANAGER ClinicAdmin to the clinic. Sends an invitation email with
   * a one-time setup link (out of scope for this PR — for now we create the
   * row directly with a temp password the OWNER must communicate securely).
   *
   * Only OWNER can add MANAGERs.
   */
  addManager: clinicAdminProcedure
    .input(
      z.object({
        nombre: z.string().min(2).max(80),
        apellido: z.string().min(2).max(80),
        email: z.string().email().max(254),
        telefono: z.string().regex(/^[\d\s+\-()]{7,20}$/).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.clinicAdminRole !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo el administrador OWNER puede agregar otros administradores.",
        })
      }
      const emailLower = input.email.toLowerCase().trim()
      const existing = await ctx.db.clinicAdmin.findUnique({
        where: { email: emailLower },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe un administrador con ese correo.",
        })
      }
      // For now: create the row with a random unguessable temp password.
      // The OWNER is expected to share the password out-of-band. (Future:
      // email-based invitation link with one-time token.)
      const tempPassword = await bcrypt.hash(
        crypto.randomUUID() + "-" + Date.now(),
        12,
      )
      const manager = await ctx.db.clinicAdmin.create({
        data: {
          email: emailLower,
          passwordHash: tempPassword,
          nombre: input.nombre,
          apellido: input.apellido,
          telefono: input.telefono,
          role: "MANAGER",
          clinicId: ctx.clinicId,
          activo: false, // inactive until the OWNER enables it after handshake
        },
        select: { id: true, email: true, nombre: true, apellido: true },
      })
      safeLog("info", "clinicAdmin.added_manager", {
        clinicId: ctx.clinicId,
        ownerId: ctx.session.clinicAdminId,
        managerId: manager.id,
      })
      return manager
    }),

  /**
   * List staff (secretaries, nurses, assistants) working in this clinic.
   * Because Staff is technically tied to Workspaces, we group by email
   * to present a unified "Clinic Staff" member to the ClinicAdmin.
   */
  listClinicStaff: clinicAdminProcedure.query(async ({ ctx }) => {
    // Find all staff across all workspaces in this clinic
    const staffRecords = await ctx.db.staff.findMany({
      where: {
        workspace: { clinicId: ctx.clinicId },
      },
      select: {
        id: true,
        email: true,
        cedula: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        createdAt: true,
        workspace: {
          select: { id: true, nombre: true, doctor: { select: { nombre: true, apellido: true } } }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    // Group by email
    const grouped = new Map<string, typeof staffRecords[0] & { workspaces: Array<{ id: string, nombre: string, doctorName: string }> }>()
    for (const record of staffRecords) {
      const emailLower = record.email.toLowerCase()
      if (!grouped.has(emailLower)) {
        grouped.set(emailLower, {
          ...record,
          workspaces: []
        })
      }
      const group = grouped.get(emailLower)!
      group.workspaces.push({
        id: record.workspace.id,
        nombre: record.workspace.nombre,
        doctorName: `${record.workspace.doctor.nombre} ${record.workspace.doctor.apellido}`
      })
      // If any of their workspace staff records are active, consider the grouped user active
      group.activo = group.activo || record.activo
    }

    return Array.from(grouped.values())
  }),

  /**
   * Create a new Staff member (e.g. Secretary) and add them to ALL
   * workspaces in the clinic automatically.
   */
  createClinicStaff: clinicAdminProcedure
    .input(z.object({
      nombre: z.string().min(2).max(80),
      apellido: z.string().min(2).max(80),
      cedula: z.string().min(5).max(15),
      email: z.string().email().max(254),
      rol: z.enum(["SECRETARY", "ASSISTANT", "NURSE"]),
      password: strongPasswordSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaces = await ctx.db.workspace.findMany({
        where: { clinicId: ctx.clinicId },
        select: { id: true }
      })

      if (workspaces.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No hay consultorios en la clínica. Un doctor debe unirse primero.",
        })
      }

      const emailLower = input.email.toLowerCase().trim()

      // Check if email already used by a doctor or clinic admin to avoid confusion,
      // although technically they have different login paths. Let's just check Staff.
      const existingStaff = await ctx.db.staff.findFirst({
        where: { email: emailLower, workspace: { clinicId: ctx.clinicId } }
      })
      if (existingStaff) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe personal con este correo en la clínica.",
        })
      }

      const pinAccesoHash = await bcrypt.hash(input.password, 12)

      const result = await ctx.db.$transaction(async (tx) => {
        const created = []
        for (const ws of workspaces) {
          const staff = await tx.staff.create({
            data: {
              nombre: input.nombre,
              apellido: input.apellido,
              cedula: input.cedula,
              email: emailLower,
              rol: input.rol,
              pinAccesoHash,
              workspaceId: ws.id,
              activo: true,
            }
          })
          created.push(staff)
        }
        return created
      })

      safeLog("info", "clinicAdmin.created_staff", {
        clinicId: ctx.clinicId,
        email: emailLower.slice(0, 3) + "***",
        workspacesCount: workspaces.length
      })

      return { count: result.length, email: emailLower }
    }),

  /**
   * Update or suspend a staff member across ALL workspaces in the clinic.
   * Matches by email since they might have multiple Staff rows.
   */
  updateClinicStaff: clinicAdminProcedure
    .input(z.object({
      email: z.string().email(),
      nombre: z.string().min(2).max(80).optional(),
      apellido: z.string().min(2).max(80).optional(),
      cedula: z.string().min(5).max(15).optional(),
      rol: z.enum(["SECRETARY", "ASSISTANT", "NURSE"]).optional(),
      activo: z.boolean().optional(),
      password: strongPasswordSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const emailLower = input.email.toLowerCase().trim()
      
      const staffRecords = await ctx.db.staff.findMany({
        where: { email: emailLower, workspace: { clinicId: ctx.clinicId } },
        select: { id: true }
      })

      if (staffRecords.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Personal no encontrado en esta clínica.",
        })
      }

      const updateData: any = {}
      if (input.nombre !== undefined) updateData.nombre = input.nombre
      if (input.apellido !== undefined) updateData.apellido = input.apellido
      if (input.cedula !== undefined) updateData.cedula = input.cedula
      if (input.rol !== undefined) updateData.rol = input.rol
      if (input.activo !== undefined) updateData.activo = input.activo
      if (input.password) {
        updateData.pinAccesoHash = await bcrypt.hash(input.password, 12)
      }

      if (Object.keys(updateData).length > 0) {
        await ctx.db.staff.updateMany({
          where: { email: emailLower, workspace: { clinicId: ctx.clinicId } },
          data: updateData,
        })
      }

      safeLog("info", "clinicAdmin.updated_staff", {
        clinicId: ctx.clinicId,
        email: emailLower.slice(0, 3) + "***",
        fields: Object.keys(updateData)
      })

      return { success: true, updatedCount: staffRecords.length }
    }),

  /**
   * List all invitation codes for this clinic.
   */
  listInvitationCodes: clinicAdminProcedure.query(async ({ ctx }) => {
    return ctx.db.clinicInvitationCode.findMany({
      where: { clinicId: ctx.clinicId },
      orderBy: { createdAt: "desc" },
      include: {
        usedBy: {
          select: { nombre: true, apellido: true }
        }
      }
    })
  }),

  /**
   * Generate a new invitation code for this clinic.
   * There should be a maximum of 2 active/generated codes per clinic (for the free tier),
   * but for now we'll just allow generating a code if there are less than 2 unused codes.
   */
  generateInvitationCode: clinicAdminProcedure.mutation(async ({ ctx }) => {
    // Count how many non-extra codes this clinic has generated.
    // Each clinic gets 2 included (free) seats.
    const freeCodesCount = await ctx.db.clinicInvitationCode.count({
      where: { clinicId: ctx.clinicId, isExtraSeat: false }
    })

    const isExtraSeat = freeCodesCount >= 2

    let code = generateClinicInvitationCode()
    for (let i = 0; i < 5; i++) {
      const exists = await ctx.db.clinicInvitationCode.findUnique({ where: { code } })
      if (!exists) break
      code = generateClinicInvitationCode()
    }

    const newCode = await ctx.db.clinicInvitationCode.create({
      data: {
        code,
        clinicId: ctx.clinicId,
        used: false,
        isExtraSeat,
      }
    })

    safeLog("info", "clinicAdmin.generated_invitation_code", {
      clinicId: ctx.clinicId,
      codeId: newCode.id,
    })

    return newCode
  }),
})
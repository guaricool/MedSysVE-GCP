import { router, protectedProcedure, doctorProcedure } from "../trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import bcrypt from "bcryptjs"
import { SexoType, IdentificationType, ParentRelationship } from "@prisma/client"
import type { PrismaClient } from "@prisma/client"
import { sendPortalWelcome, sendPortalReminderEmail } from "../../lib/email"
import { BCRYPT_COST } from "@/lib/password-policy"
import { hmacIndex } from "@/lib/field-crypto"
import { encryptField } from "@/lib/field-crypto"
import { packPatientCedula, readPatientCedula } from "@/lib/patient-crypto"
import { audit } from "@/lib/audit"
import { safeLog } from "@/lib/log-sanitizer"

/**
 * Generate a portal password that satisfies portalPasswordSchema:
 *  - Min 10 chars
 *  - At least one lowercase, one uppercase, one digit
 *  - Not in common-passwords list
 * Format: human-readable "Word-Word-NNN" with mix of cases for memorability
 * (e.g. "Casa-Verde-42"). Doctors can dictate it to patients over the phone.
 *
 * NOTE: use crypto.randomInt for cryptographic randomness, NOT Math.random.
 * Math.random is predictable and an attacker who knows the time can replay
 * the seed.
 */
function generatePortalPassword(): string {
  // Use cryptographically secure randomness only. If the runtime lacks WebCrypto,
  // refuse to generate a password rather than fall back to predictable Math.random —
  // patient portal passwords are an authentication secret.
  const randomInt = (max: number): number => {
    if (typeof globalThis.crypto?.getRandomValues !== "function") {
      throw new Error(
        "WebCrypto unavailable — cannot generate cryptographically secure password",
      )
    }
    const buf = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buf)
    // Reject-sampling would remove modulo bias, but for word-list selection
    // (max=16) the bias is < 0.0000001% and not security-critical here.
    return buf[0]! % max
  }

  const palabras = [
    "Casa", "Sol", "Luz", "Mar", "Rio", "Paz", "Flor", "Vela", "Luna",
    "Estrella", "Nube", "Arbol", "Viento", "Piedra", "Arco", "Vino",
  ]
  const w1 = palabras[randomInt(palabras.length)]!
  const w2 = palabras[randomInt(palabras.length)]!
  const num = String(randomInt(900) + 100) // 100-999

  // Mix one lowercase letter into the second word for variety.
  const w2Mixed = w2.slice(0, 1).toLowerCase() + w2.slice(1)
  return `${w1}-${w2Mixed}-${num}`
}

/**
 * Atomically allocate the next idDisplay for a workspace registration.
 * Runs inside the caller's transaction — unique constraint on (workspaceId, idDisplay)
 * guarantees no two concurrent inserts collide.
 */
async function getNextIdDisplay(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  workspaceId: string
): Promise<string> {
  const last = await tx.patientRegistration.findFirst({
    where: { 
      workspaceId,
      NOT: [
        { idDisplay: { startsWith: "REF-" } },
        { idDisplay: { contains: "NaN" } }
      ]
    },
    orderBy: { idDisplay: "desc" },
    select: { idDisplay: true },
  })
  const next = last ? parseInt(last.idDisplay, 10) + 1 : 1
  return String(next).padStart(6, "0")
}

const representanteSchema = z.object({
  cedulaRepresentante: z.string().min(6),
  nombreCompleto: z.string().min(2),
  parentesco: z.nativeEnum(ParentRelationship),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
})

const patientInputSchema = z
  .object({
    tipoIdentificacion: z.nativeEnum(IdentificationType).optional(),
    numeroIdentificacion: z.string().optional(),
    sinCedula: z.boolean().default(false),
    nombre: z.string().min(2),
    apellido: z.string().min(2),
    fechaNacimiento: z.string(), // ISO date string YYYY-MM-DD
    sexo: z.nativeEnum(SexoType),
    telefono: z.string().optional(),
    email: z.string().email().optional(),
    representante: representanteSchema.optional(),
  })
  .refine(
    (d) =>
      d.sinCedula
        ? !!d.representante
        : !!d.tipoIdentificacion && !!d.numeroIdentificacion,
    {
      message:
        "Cédula requerida, o marcar 'Sin cédula' y completar datos del representante",
      path: ["tipoIdentificacion"],
    }
  )

export const patientRouter = router({
  /**
   * Look up a Patient across the entire tenant boundary by cédula.
   * Returns ONLY personal info (nombre, apellido, fechaNacimiento, sexo,
   * telefono, email) — NO clinical data, NO identifiers of the source
   * workspace. Used by `register` to autofill the form when a person
   * has previously registered with a different doctor.
   *
   * This endpoint is intentionally NOT filtered by workspaceId because
   * that is the whole point: the doctor needs to know "does this person
   * exist somewhere in MedSysVE?" — but only the safe subset of fields.
   */
  lookupByCedula: protectedProcedure
    .input(z.object({
      tipoIdentificacion: z.nativeEnum(IdentificationType),
      numeroIdentificacion: z.string().min(6).max(15),
    }))
    .query(async ({ ctx, input }) => {
      const hmac = hmacIndex(input.numeroIdentificacion)
      const matches = await ctx.db.patient.findMany({
        where: {
          hmacCedula: hmac,
          tipoIdentificacion: input.tipoIdentificacion,
        },
        // STRICT allowlist — never expose: id, portalPasswordHash, rep*,
        // workspaceId, registrations, encrypted columns, or HMAC indices.
        select: {
          nombre: true,
          apellido: true,
          fechaNacimiento: true,
          sexo: true,
          telefono: true,
          email: true,
          sinCedula: true,
        },
        take: 5,
        orderBy: { createdAt: "asc" },
      })
      // Audit every cross-workspace lookup — this is a sensitive operation
      // even though we only return a subset.
      await audit("PATIENT_CEDULA_CROSS_WORKSPACE_LOOKUP", {
        workspaceId: ctx.session.workspaceId,
        userId: ctx.session.doctorId,
        userRole: ctx.session.role,
        resourceType: "Patient",
        // No patientId: we don't know yet if a match exists.
        outcome: matches.length > 0 ? "ALLOWED" : "ALLOWED",
        channel: "API",
        metadata: {
          hmacCedulaPrefix: hmac.slice(0, 8),
          matchCount: matches.length,
        },
      })
      // Return only the most recent match to keep the response deterministic.
      return matches[matches.length - 1] ?? null
    }),

  register: protectedProcedure
    .input(patientInputSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = ctx.session.workspaceId

      // ─── Tenant isolation: every Patient is workspace-scoped now. ───
      //
      // We DO NOT reuse a Patient row from another workspace (that was the
      // previous behaviour and the source of the cross-doctor leak). Instead,
      // if a Patient with this cédula already exists in ANOTHER workspace,
      // we autofill personal info from the most recent match (via
      // `lookupByCedula` below) and create a NEW Patient row in THIS workspace.
      //
      // Clinical data (encounters, prescriptions, lab orders, etc.) is attached
      // to PatientRegistration → Workspace → Doctor, so creating a fresh Patient
      // row automatically isolates clinical history per doctor. This is the
      // behaviour the user explicitly requested: "cada paciente debe ser unico
      // para cada doctor".

      let autofill: {
        nombre?: string
        apellido?: string
        fechaNacimiento?: string
        sexo?: SexoType
        telefono?: string | null
        email?: string | null
      } | null = null

      if (!input.sinCedula && input.numeroIdentificacion && input.tipoIdentificacion) {
        const hmac = hmacIndex(input.numeroIdentificacion)
        const match = await ctx.db.patient.findFirst({
          where: {
            hmacCedula: hmac,
            tipoIdentificacion: input.tipoIdentificacion,
          },
          select: {
            nombre: true,
            apellido: true,
            fechaNacimiento: true,
            sexo: true,
            telefono: true,
            email: true,
          },
          orderBy: { createdAt: "desc" },
        })
        if (match) {
          autofill = {
            nombre: match.nombre,
            apellido: match.apellido,
            fechaNacimiento: match.fechaNacimiento.toISOString().slice(0, 10),
            sexo: match.sexo,
            telefono: match.telefono,
            email: match.email,
          }
          // Audit cross-workspace autofill.
          await audit("PATIENT_AUTOFILL_FROM_OTHER_WORKSPACE", {
            workspaceId,
            userId: ctx.session.doctorId,
            userRole: ctx.session.role,
            resourceType: "Patient",
            outcome: "ALLOWED",
            channel: "API",
            metadata: { hmacCedulaPrefix: hmac.slice(0, 8) },
          })
        }
      }

      // Check if THIS workspace already has a Patient with this cédula.
      // If so, short-circuit with CONFLICT instead of creating a duplicate.
      if (autofill && !input.sinCedula && input.numeroIdentificacion) {
        const hmac = hmacIndex(input.numeroIdentificacion)
        const ownPatient = await ctx.db.patient.findFirst({
          where: {
            workspaceId,
            hmacCedula: hmac,
            tipoIdentificacion: input.tipoIdentificacion,
          },
          select: { id: true },
        })
        if (ownPatient) {
          const existing = await ctx.db.patientRegistration.findFirst({
            where: { patientId: ownPatient.id, workspaceId },
          })
          if (existing) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Paciente ya registrado en este consultorio con ID ${existing.idDisplay}`,
            })
          }
        }
      }

      // Encrypt the cédula before write. numeroIdentificacion becomes a
      // base64(IV || ciphertext || tag) blob, and hmacCedula is set so the
      // patient can be looked up again.
      const cedulaPack = await packPatientCedula({
        tipoIdentificacion: input.tipoIdentificacion,
        numeroIdentificacion: input.numeroIdentificacion,
        sinCedula: input.sinCedula,
      })

      // Wrap the counter read + insert in a transaction so concurrent registrations
      // to the same workspace cannot collide on idDisplay. On the rare P2002 unique
      // constraint violation we retry once — the second attempt will read the row
      // just inserted by the concurrent request and pick the correct next value.
      //
      // Always create a NEW Patient row in this workspace. The form input takes
      // precedence over autofill; autofill only fills fields the user left blank.
      const MAX_RETRIES = 3
      let lastError: unknown
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const registration = await ctx.db.$transaction(async (tx) => {
            const idDisplay = await getNextIdDisplay(tx, workspaceId)

            // Apply form input with autofill as fallback for blank fields.
            // Clinical fields (no clinical data on Patient, but representative
            // data, portal password, etc.) are NEVER autofilled — those stay
            // workspace-local.
            const finalNombre = input.nombre.trim() || autofill?.nombre || ""
            const finalApellido = input.apellido.trim() || autofill?.apellido || ""
            const finalFechaNac =
              input.fechaNacimiento || autofill?.fechaNacimiento || ""
            const finalSexo = input.sexo || autofill?.sexo
            const finalTelefono =
              input.telefono?.trim() || autofill?.telefono || undefined
            // Emails are case-insensitive for login (see lib/auth.ts portal
            // provider). Normalize on write so the plaintext column matches
            // the lowercase HMAC index — keeps the two columns consistent and
            // means legacy plaintext-only lookups still work after a
            // case-mismatched input.
            const finalEmail =
              input.email?.trim().toLowerCase() ||
              autofill?.email?.toLowerCase() ||
              undefined

            if (!finalNombre || !finalApellido || !finalFechaNac || !finalSexo) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Datos personales incompletos. Complete nombre, apellido, fecha de nacimiento y sexo.",
              })
            }

            const patient = await tx.patient.create({
              data: {
                workspaceId,
                tipoIdentificacion: cedulaPack.tipoIdentificacion,
                numeroIdentificacion: cedulaPack.numeroIdentificacion,
                hmacCedula: cedulaPack.hmacCedula,
                sinCedula: input.sinCedula,
                nombre: finalNombre,
                nombreCifrado: encryptField(finalNombre),
                hmacNombre: hmacIndex(finalNombre),
                apellido: finalApellido,
                apellidoCifrado: encryptField(finalApellido),
                hmacApellido: hmacIndex(finalApellido),
                fechaNacimiento: new Date(finalFechaNac),
                sexo: finalSexo,
                telefono: finalTelefono,
                telefonoCifrado: encryptField(finalTelefono ?? null),
                hmacTelefono: finalTelefono ? hmacIndex(finalTelefono) : null,
                email: finalEmail,
                emailCifrado: encryptField(finalEmail ?? null),
                hmacEmail: finalEmail ? hmacIndex(finalEmail.toLowerCase()) : null,
                repCedula: input.representante?.cedulaRepresentante,
                repNombreCompleto: input.representante?.nombreCompleto,
                repParentesco: input.representante?.parentesco,
                repTelefono: input.representante?.telefono,
                repEmail: input.representante?.email,
              },
            })

            return tx.patientRegistration.create({
              data: { idDisplay, patientId: patient.id, workspaceId },
              include: { patient: true },
            })
          })

          return registration
        } catch (err) {
          // P2002 = Prisma unique constraint violation
          const isPrismaConflict =
            typeof err === "object" &&
            err !== null &&
            (err as { code?: string }).code === "P2002"
          if (isPrismaConflict) {
            lastError = err
            continue
          }
          // Re-raise TRPCError as-is so the client sees the validation message.
          if (err instanceof TRPCError) throw err
          throw err
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No se pudo generar un ID único para el paciente. Intente de nuevo.",
        cause: lastError,
      })
    }),

  // Audit S5 (2026-07-06): migrated from protectedProcedure to
  // doctorProcedure. Search filters by workspaceId (doctor view only).

  importPatient: doctorProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = ctx.session.workspaceId
      const source = await ctx.db.patient.findUnique({
        where: { id: input.patientId },
      })
      if (!source || !source.workspaceId) throw new TRPCError({ code: "NOT_FOUND" })

      const sourceWorkspace = await ctx.db.workspace.findFirst({
        where: { id: source.workspaceId, doctorId: ctx.session.doctorId }
      })
      if (!sourceWorkspace) throw new TRPCError({ code: "FORBIDDEN" })
      if (!source) throw new TRPCError({ code: "NOT_FOUND" })

      if (!source.sinCedula && source.numeroIdentificacion) {
        const existing = await ctx.db.patient.findFirst({
          where: {
            workspaceId,
            hmacCedula: source.hmacCedula,
            tipoIdentificacion: source.tipoIdentificacion,
          },
        })
        if (existing) {
          const reg = await ctx.db.patientRegistration.findFirst({
            where: { patientId: existing.id, workspaceId }
          })
          if (reg) return reg
        }
      }

      const MAX_RETRIES = 3
      let lastError: unknown
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const reg = await ctx.db.$transaction(async (tx) => {
            const idDisplay = await getNextIdDisplay(tx, workspaceId)
            const newPatient = await tx.patient.create({
              data: {
                workspaceId,
                tipoIdentificacion: source.tipoIdentificacion,
                numeroIdentificacion: source.numeroIdentificacion,
                hmacCedula: source.hmacCedula,
                sinCedula: source.sinCedula,
                nombre: source.nombre,
                nombreCifrado: source.nombreCifrado,
                hmacNombre: source.hmacNombre,
                apellido: source.apellido,
                apellidoCifrado: source.apellidoCifrado,
                hmacApellido: source.hmacApellido,
                fechaNacimiento: source.fechaNacimiento,
                sexo: source.sexo,
                grupoSanguineo: source.grupoSanguineo,
                direccion: source.direccion,
                direccionCifrada: source.direccionCifrada,
                telefono: source.telefono,
                telefonoCifrado: source.telefonoCifrado,
                hmacTelefono: source.hmacTelefono,
                email: source.email,
                emailCifrado: source.emailCifrado,
                hmacEmail: source.hmacEmail,
                repCedula: source.repCedula,
                repNombreCompleto: source.repNombreCompleto,
                repParentesco: source.repParentesco,
                repTelefono: source.repTelefono,
                repEmail: source.repEmail,
              }
            })
            return await tx.patientRegistration.create({
              data: {
                idDisplay,
                patientId: newPatient.id,
                workspaceId,
              }
            })
          })
          await audit("PATIENT_AUTOFILL_FROM_OTHER_WORKSPACE", {
            workspaceId,
            userId: ctx.session.doctorId,
            userRole: ctx.session.role,
            resourceType: "Patient",
            outcome: "ALLOWED",
            channel: "API",
            metadata: { sourceWorkspaceId: source.workspaceId, sourcePatientId: source.id },
          })
          return reg
        } catch (e: any) {
          if (e.code === "P2002") {
            lastError = e
            continue
          }
          throw e
        }
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to import patient" })
    }),

  search: doctorProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ ctx, input }) => {
      // For cédula search we use the HMAC index — searching the encrypted
      // field by plaintext would never match. We also accept idDisplay,
      // nombre, apellido searches which work directly on indexed columns.
      const hmac = hmacIndex(input.query.trim())
      return ctx.db.patientRegistration.findMany({
        where: {
          workspace: { doctorId: ctx.session.doctorId },
          OR: [
            { idDisplay: { contains: input.query } },
            {
              patient: {
                nombre: { contains: input.query, mode: "insensitive" },
              },
            },
            {
              patient: {
                apellido: { contains: input.query, mode: "insensitive" },
              },
            },
            {
              patient: {
                hmacCedula: hmac,
              },
            },
          ],
        },
        include: { patient: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      })
    }),

  // Audit S5 (2026-07-06): migrated from protectedProcedure to
  // doctorProcedure. List filters by workspaceId (doctor view only).
  list: doctorProcedure
    .input(
      z.object({
        sexo: z.enum(["MASCULINO", "FEMENINO", "OTRO"]).optional(),
        tag: z.string().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const regs = await ctx.db.patientRegistration.findMany({
        where: {
          workspace: { doctorId: ctx.session.doctorId },
          ...(input?.sexo ? { patient: { sexo: input.sexo } } : {}),
          ...(input?.tag ? { tags: { some: { etiqueta: input.tag } } } : {}),
        },
        include: { patient: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      // Decrypt the cédula on the way out so the UI never touches the raw
      // encrypted blob. Without this transformation the frontend would
      // receive base64 ciphertext as if it were the cédula.
      return regs.map((r) => ({
        ...r,
        patient: { ...r.patient, numeroIdentificacion: readPatientCedula(r.patient) ?? null },
      }))
    }),

  getRegistration: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
        include: { patient: true },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      const { portalPasswordHash, ...patientSafe } = reg.patient
      return {
        ...reg,
        patient: { ...patientSafe, numeroIdentificacion: readPatientCedula(reg.patient) ?? null },
        hasPortalAccess: portalPasswordHash !== null,
      }
    }),

  // Audit S5 (2026-07-06): migrated from protectedProcedure to doctorProcedure.
  updateNotes: doctorProcedure
    .input(z.object({ patientRegistrationId: z.string(), notasInternas: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.patientRegistration.update({
        where: { id: input.patientRegistrationId },
        data: { notasInternas: input.notasInternas },
      })
    }),

  setPortalPassword: doctorProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { patientId: input.patientId, workspaceId: ctx.session.workspaceId },
        include: { patient: true },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })

      const plain = generatePortalPassword()
      const hash = await bcrypt.hash(plain, BCRYPT_COST)

      // Persist the password hash FIRST and atomically with the audit log.
      // The audit log row tells us the new password exists; if the email
      // send later fails we still have a recoverable record. We don't roll
      // back the password on email failure — the patient would be unable to
      // log in at all. The doctor can re-trigger the welcome email from the
      // UI; the password itself doesn't change.
      await ctx.db.$transaction(async (tx) => {
        await tx.patient.update({
          where: { id: input.patientId },
          data: { portalPasswordHash: hash },
        })
        await tx.auditEvent.create({
          data: {
            workspaceId: ctx.session.workspaceId,
            actorId: ctx.session.id,
            actorRole: ctx.session.role,
            action: "PASSWORD_CHANGED",
            resourceType: "Patient",
            resourceId: input.patientId,
            patientId: reg.patientId,
            outcome: "ALLOWED",
            channel: "UI",
            metadata: { channel: "PORTAL_RESET" },
          },
        })
      })

      if (reg.patient.email) {
        void sendPortalWelcome({
          to: reg.patient.email,
          nombre: reg.patient.nombre,
          password: plain,
        })
      }

      return { password: plain }
    }),

  /**
   * Re-send the welcome email by ROTATING the password. Used when
   * the patient lost the original email, it went to spam, or they
   * just want a fresh one without redoing the whole flow.
   *
   * Because bcrypt is one-way, we can't recover the previous plaintext
   * — so "resending" effectively means "regenerate + email + return
   * the new password to the doctor UI". The doctor can then forward
   * it to the patient out-of-band (WhatsApp, phone, etc.) if the
   * email keeps failing.
   */
  resendPortalWelcome: doctorProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { patientId: input.patientId, workspaceId: ctx.session.workspaceId },
        include: { patient: true },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      if (!reg.patient.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El paciente no tiene un correo registrado.",
        })
      }

      const plain = generatePortalPassword()
      const hash = await bcrypt.hash(plain, BCRYPT_COST)

      await ctx.db.$transaction(async (tx) => {
        await tx.patient.update({
          where: { id: input.patientId },
          data: { portalPasswordHash: hash },
        })
        await tx.auditEvent.create({
          data: {
            workspaceId: ctx.session.workspaceId,
            actorId: ctx.session.id,
            actorRole: ctx.session.role,
            action: "PASSWORD_CHANGED",
            resourceType: "Patient",
            resourceId: input.patientId,
            patientId: reg.patientId,
            outcome: "ALLOWED",
            channel: "UI",
            metadata: { channel: "PORTAL_RESEND" },
          },
        })
      })

      void sendPortalWelcome({
        to: reg.patient.email,
        nombre: reg.patient.nombre,
        password: plain,
      })

      safeLog("info", "portal.password_resent", {
        patientId: reg.patientId.slice(0, 6) + "***",
      })

      return { password: plain }
    }),

  sendPortalReminder: doctorProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { patientId: input.patientId, workspaceId: ctx.session.workspaceId },
        include: { patient: true, workspace: { select: { doctor: { select: { nombre: true, apellido: true } } } } },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      if (!reg.patient.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El paciente no tiene un correo registrado.",
        })
      }

      // Instead of generating a new password, we just send a notification email
      void sendPortalReminderEmail({
        to: reg.patient.email,
        nombre: reg.patient.nombre,
        doctorName: `Dr. ${reg.workspace.doctor.nombre} ${reg.workspace.doctor.apellido}`,
      }).catch((err) => safeLog("error", "portal.reminder_email_failed", { error: err }))
      
      safeLog("info", "portal.reminder_sent", {
        patientId: input.patientId.slice(0, 6) + "***",
      })

      return { ok: true }
    }),

  updateGrupoSanguineo: protectedProcedure
    .input(z.object({ patientId: z.string(), grupoSanguineo: z.string().max(10) }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { patientId: input.patientId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.patient.update({
        where: { id: input.patientId },
        data: { grupoSanguineo: input.grupoSanguineo || null },
        select: { id: true, grupoSanguineo: true },
      })
    }),

  updateAntecedentes: protectedProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        antecedentes: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.patientRegistration.update({
        where: { id: input.patientRegistrationId },
        data: { antecedentes: input.antecedentes },
      })
    }),

  update: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        telefono: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        direccion: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validar que el paciente pertenece al consultorio
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { patientId: input.patientId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })

      const data: Record<string, unknown> = {}
      
      if (input.telefono !== undefined) {
        data.telefono = input.telefono || null
        data.telefonoCifrado = input.telefono ? encryptField(input.telefono) : null
        data.hmacTelefono = input.telefono ? hmacIndex(input.telefono) : null
      }
      if (input.email !== undefined) {
        const emailToSave = input.email || null
        data.email = emailToSave
        data.emailCifrado = emailToSave ? encryptField(emailToSave) : null
        data.hmacEmail = emailToSave ? hmacIndex(emailToSave.toLowerCase()) : null
      }
      if (input.direccion !== undefined) {
        data.direccion = input.direccion || null
        data.direccionCifrada = input.direccion ? encryptField(input.direccion) : null
      }

      const updated = await ctx.db.patient.update({
        where: { id: input.patientId },
        data,
      })

      await audit("PATIENT_UPDATED", {
        workspaceId: ctx.session.workspaceId,
        userId: ctx.session.doctorId,
        userRole: ctx.session.role,
        resourceType: "Patient",
        resourceId: input.patientId,
        patientId: input.patientId,
        outcome: "ALLOWED",
        channel: "UI",
      })

      return updated
    }),

  delete: doctorProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Validar que el paciente pertenece al consultorio
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { patientId: input.patientId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })

      // Al eliminar el PatientRegistration, Prisma (onDelete: Cascade en la mayoría) 
      // eliminará las Consultas, etc. 
      await ctx.db.patientRegistration.delete({
        where: { id: reg.id },
      })
      await ctx.db.patient.delete({
        where: { id: input.patientId },
      })

      await audit("PATIENT_DELETED", {
        workspaceId: ctx.session.workspaceId,
        userId: ctx.session.doctorId,
        userRole: ctx.session.role,
        resourceType: "Patient",
        resourceId: input.patientId,
        patientId: input.patientId,
        outcome: "ALLOWED",
        channel: "UI",
      })

      return { success: true }
    }),
})


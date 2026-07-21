import crypto from "node:crypto"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"
import { logAudit, audit } from "@/lib/audit"
import { encryptField, decryptField } from "@/lib/field-crypto"
import { packEncounterMotivo, readEncounterMotivo } from "@/lib/encounter-crypto"
import { signEncounterHash } from "@/lib/encounter-signing"
import {
  optimisticUpdate,
  OptimisticUpdateError,
} from "@/lib/db/optimistic-update"
import { Prisma } from "@prisma/client"
import { generateAndSendEncounterSummary } from "@/lib/email-summary"

function safeDecrypt(ciphertext: string): string | null {
  try {
    return decryptField(ciphertext) ?? null
  } catch {
    return null
  }
}

const vitalesSchema = z.object({
  taSistolica: z.number().optional(),
  taDiastolica: z.number().optional(),
  fc: z.number().optional(),
  fr: z.number().optional(),
  temperatura: z.number().optional(),
  peso: z.number().optional(),
  talla: z.number().optional(),
  spo2: z.number().optional(),
  glasgow: z.number().optional(),
})

export const encounterRouter = router({
  create: doctorProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        appointmentId: z.string().optional(),
        motivo: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.encounter.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
          doctorId: ctx.session.doctorId,
          appointmentId: input.appointmentId,
          ...packEncounterMotivo({ motivo: input.motivo }),
          status: "DRAFT",
        },
      })
    }),

  get: doctorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.id === "sandbox-demo") {
        return {
          id: "sandbox-demo",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          patientRegistrationId: "sandbox-demo-pat",
          doctorId: ctx.session.doctorId ?? "sandbox-doc",
          status: "DRAFT",
          motivo: "Consulta médica de control y evaluación de especialidad",
          historiaClinica: "Paciente acude a consulta presentando cuadro sintomático característico para evaluación especializada.",
          examenFisico: null,
          plan: "Plan de tratamiento y seguimiento médico.",
          datosEspecialidad: {},
          diagnoses: [],
          prescriptions: [],
          labOrders: [],
          imagingOrders: [],
          documents: [],
          scales: null,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any
      }
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
        include: {
          diagnoses: { orderBy: { createdAt: "asc" } },
          prescriptions: {
            include: { items: { include: { medication: true } } },
            orderBy: { createdAt: "desc" },
          },
          labOrders: { orderBy: { createdAt: "desc" } },
          imagingOrders: { orderBy: { createdAt: "desc" } },
          documents: { orderBy: { createdAt: "desc" } },
          scales: true,
        },
      })
      if (!enc) throw new TRPCError({ code: "NOT_FOUND" })
      // Audit + decrypt on read.
      void audit("VIEW_ENCOUNTER", {
        userId: ctx.session.id,
        userRole: ctx.session.role,
        workspaceId: ctx.session.workspaceId,
        resourceType: "Encounter",
        resourceId: enc.id,
        patientId: enc.patientRegistrationId,
      })
      // Prefer the encrypted fields; fall back to legacy plaintext only if
      // decryption fails (key rotation mismatch, corruption, or row was
      // written before encryption was wired). We never throw on a
      // decryption error â€” a tampered field must not 500 the entire page.
      return {
        ...enc,
        motivo: readEncounterMotivo(enc) ?? null,
        historiaClinica: enc.historiaClinicaCifrada ? safeDecrypt(enc.historiaClinicaCifrada) ?? enc.historiaClinica ?? null : enc.historiaClinica ?? null,
        plan: enc.planCifrado ? safeDecrypt(enc.planCifrado) ?? enc.plan ?? null : enc.plan ?? null,
      }
    }),

  list: doctorProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.encounter.findMany({
        where: {
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
        },
        orderBy: { createdAt: "desc" },
        // vitales is a JSON column, not a relation â€” must live in `select`.
        // Without it, VitalsChart + PediatricPanel render empty.
        select: {
          id: true,
          createdAt: true,
          status: true,
          motivoCifrado: true,
          vitales: true,
          diagnoses: { select: { id: true, codigoCie10: true, descripcion: true, tipo: true } },
          _count: { select: { prescriptions: true } },
        },
      })
      // Decrypt motivo per-row so the client sees the plaintext value
      // without having to know about encryption. Strip motivoCifrado
      // (ciphertext) from the return â€” the client only needs the decrypted
      // motivo value. Note: motivo column was dropped in migration
      // 20260703010000_drop_encounter_motivo_legacy, so we read from
      // motivoCifrado only.
      return rows.map((e) => {
        const { motivoCifrado: _drop, ...rest } = e
        return {
          ...rest,
          motivo: readEncounterMotivo({ motivoCifrado: e.motivoCifrado }) ?? null,
        }
      })
    }),

  update: doctorProcedure
    .input(
      z.object({
        id: z.string(),
        motivo: z.string().optional(),
        historiaClinica: z.string().optional(),
        plan: z.string().optional(),
        examenFisico: z.any().optional(),
        datosEspecialidad: z.any().optional(),
        // Audit S9 (2026-07-07): optimistic-locking version. When provided,
        // the router enforces `WHERE id=? AND version=?` so concurrent edits
        // don't silently last-write-wins. Clients should track the version
        // returned from `get` and resend it on every save.
        version: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id === "sandbox-demo") {
        return { id: "sandbox-demo", version: (input.version ?? 1) + 1 } as any
      }
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!enc) throw new TRPCError({ code: "NOT_FOUND" })
      if (enc.status !== "DRAFT")
        throw new TRPCError({ code: "FORBIDDEN", message: "Consulta firmada, no editable." })
      const { id, version: expectedVersion, ...rest } = input
      // Encrypt PHI fields before write. We write ONLY to the encrypted
      // columns (motivoCifrado, historiaClinicaCifrada, planCifrado) â€” the legacy
      // plaintext columns (motivo, historiaClinica, plan) are intentionally left
      // untouched so any existing rows are migrated by the operator-run
      // migration script rather than silently re-populated with new plaintext
      // on every update. HIPAA + LOPDP require no PHI at rest in plaintext.
      const data: Record<string, unknown> = {}
      if (rest.motivo !== undefined) {
        const packed = packEncounterMotivo({ motivo: rest.motivo })
        data.motivoCifrado = packed.motivoCifrado
        data.motivoHmac = packed.motivoHmac
      }
      if (rest.historiaClinica !== undefined) {
        data.historiaClinicaCifrada = encryptField(rest.historiaClinica)
      }
      if (rest.plan !== undefined) {
        data.planCifrado = encryptField(rest.plan)
      }
      if (rest.examenFisico !== undefined) data.examenFisico = rest.examenFisico
      if (rest.datosEspecialidad !== undefined) data.datosEspecialidad = rest.datosEspecialidad
      // Always advance the version counter on success (audit S9).
      data.version = { increment: 1 }

      // Optimistic-locking path: when the client provides `version`, enforce
      // exact match. Mismatch â†’ TRPCError CONFLICT with current version in
      // `cause` so the client can refetch + reapply.
      if (expectedVersion !== undefined) {
        try {
          return await optimisticUpdate(ctx.db, "encounter", id, {
            expectedVersion,
            data,
            workspaceId: ctx.session.workspaceId,
          })
        } catch (err) {
          if (err instanceof OptimisticUpdateError) {
            void audit("ENCOUNTER_CONFLICT", {
              workspaceId: ctx.session.workspaceId,
              userId: ctx.session.id,
              metadata: {
                expectedVersion: err.cause.expectedVersion,
                currentVersion: err.cause.currentVersion,
                procedure: "update",
                fields: Object.keys(rest).filter((k) => rest[k as keyof typeof rest] !== undefined),
              },
            })
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "Otro doctor (o auto-save) modificÃ³ esta consulta. Recarga y vuelve a aplicar tus cambios.",
              cause: err.cause,
            })
          }
          throw err
        }
      }
      // Legacy path (no version supplied): last-write-wins. Kept during
      // gradual rollout so old client bundles keep working. Plan to remove
      // once all forms track version (see components/encounter/*).
      return ctx.db.encounter.update({ where: { id }, data })
    }),

  saveVitals: doctorProcedure
    .input(
      z.object({
        id: z.string(),
        vitales: vitalesSchema,
        // Audit S9 (2026-07-07): optimistic-locking version.
        version: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!enc) throw new TRPCError({ code: "NOT_FOUND" })
      if (enc.status !== "DRAFT")
        throw new TRPCError({ code: "FORBIDDEN", message: "Consulta firmada, no editable." })
      const data: Record<string, unknown> = {
        vitales: input.vitales,
        version: { increment: 1 },
      }
      if (input.version !== undefined) {
        try {
          return await optimisticUpdate(ctx.db, "encounter", input.id, {
            expectedVersion: input.version,
            data,
            workspaceId: ctx.session.workspaceId,
          })
        } catch (err) {
          if (err instanceof OptimisticUpdateError) {
            void audit("ENCOUNTER_CONFLICT", {
              workspaceId: ctx.session.workspaceId,
              userId: ctx.session.id,
              metadata: {
                expectedVersion: err.cause.expectedVersion,
                currentVersion: err.cause.currentVersion,
                procedure: "saveVitals",
              },
            })
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "Otro doctor (o auto-save) modificÃ³ esta consulta. Recarga y vuelve a aplicar tus cambios.",
              cause: err.cause,
            })
          }
          throw err
        }
      }
      return ctx.db.encounter.update({
        where: { id: input.id },
        data,
      })
    }),

  updateReportOverride: doctorProcedure
    .input(
      z.object({
        id: z.string(),
        reportOverride: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!enc) throw new TRPCError({ code: "NOT_FOUND" })
      if (enc.status !== "DRAFT")
        throw new TRPCError({ code: "FORBIDDEN", message: "Consulta firmada, no editable." })
      return ctx.db.encounter.update({
        where: { id: input.id },
        data: { reportOverride: input.reportOverride },
      })
    }),

  addDiagnosis: doctorProcedure
    .input(
      z.object({
        encounterId: z.string(),
        codigoCie10: z.string(),
        descripcion: z.string(),
        tipo: z.enum(["PRINCIPAL", "SECUNDARIO"]).default("PRINCIPAL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
      if (!enc || enc.status !== "DRAFT") throw new TRPCError({ code: "FORBIDDEN" })
      return ctx.db.diagnosis.create({ data: input })
    }),

  removeDiagnosis: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const diag = await ctx.db.diagnosis.findFirst({
        where: { id: input.id },
        include: { encounter: { select: { workspaceId: true, status: true } } },
      })
      if (!diag || diag.encounter.workspaceId !== ctx.session.workspaceId)
        throw new TRPCError({ code: "FORBIDDEN" })
      if (diag.encounter.status !== "DRAFT")
        throw new TRPCError({ code: "FORBIDDEN", message: "Consulta firmada." })
      return ctx.db.diagnosis.delete({ where: { id: input.id } })
    }),

  sign: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!enc) throw new TRPCError({ code: "NOT_FOUND" })
      if (enc.status !== "DRAFT")
        throw new TRPCError({ code: "FORBIDDEN", message: "Consulta ya firmada." })
const updated = await ctx.db.encounter.update({
          where: { id: input.id },
          data: {
            status: "SIGNED",
            signedAt: new Date(),
            signedBy: ctx.session.doctorId,
            // Cryptographic signature hash. Stored alongside the encounter
            // so tampering after sign (changing signedBy/signedAt or the
            // clinical content) is detectable. Uses FIELD_ENCRYPTION_KEY as
            // the HMAC secret â€” same key already provisioned for field-level
            // encryption, so no new env var is required.
            //
            // signedBy + signedAt + content hash are all bound together; an
            // attacker who edits any one cannot recompute the signature
            // without the encryption key.
            signatureHash: signEncounterHash({
              encounterId: enc.id,
              signedBy: ctx.session.doctorId,
              signedAt: new Date(),
              historiaClinicaCifrada: enc.historiaClinicaCifrada,
              planCifrado: enc.planCifrado,
              vitales: enc.vitales,
              examenFisico: enc.examenFisico,
            }),
          },
        })
      void logAudit({
        workspaceId: ctx.session.workspaceId,
        accion: "CONSULTA_FIRMADA",
        entidad: "Encounter",
        entidadId: input.id,
        actorId: ctx.session.doctorId,
        actorNombre: ctx.session.nombre,
        // Do NOT include motivo here â€” motivo is PHI. Audit log records the
        // resource ID and patient pointer only; clinical content stays in the
        // (encrypted) encounter row.
        detalle: { patientRegistrationId: enc.patientRegistrationId },
      })
      if (enc.appointmentId) {
        await ctx.db.appointment.updateMany({
          where: {
            id: enc.appointmentId,
            workspaceId: ctx.session.workspaceId,
            status: { in: ["SCHEDULED", "CONFIRMED"] },
          },
          data: { status: "COMPLETED" },
        })
      }

      // Send encounter summary email in the background
      void generateAndSendEncounterSummary(input.id).catch((err) => {
        console.error(`[Email Summary] Failed for encounter ${input.id}:`, err)
      })

      return updated
    }),

  addLabOrder: doctorProcedure
    .input(
      z.object({
        encounterId: z.string(),
        estudios: z.array(z.string()).min(1),
        indicacionesClinicas: z.string().optional(),
        urgente: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
      if (!enc || enc.status !== "DRAFT") throw new TRPCError({ code: "FORBIDDEN" })
      return ctx.db.labOrder.create({ data: input })
    }),

  addImagingOrder: doctorProcedure
    .input(
      z.object({
        encounterId: z.string(),
        // The order carries an urgency flag, a shared diagnosis / clinical
        // indication, and a list of studies. Accept both shapes:
        //  - new: `items: [{ tipoImagen, region, notas? }, ...]` (preferred)
        //  - legacy: `tipoImagen` + `region` (auto-promoted to one item so
        //    existing forms keep working through the migration window)
        items: z
          .array(
            z.object({
              tipoImagen: z.string().min(1),
              region: z.string().min(1),
              notas: z.string().optional(),
            }),
          )
          .min(1)
          .optional(),
        tipoImagen: z.string().optional(),
        region: z.string().optional(),
        indicacionesClinicas: z.string().optional(),
        urgente: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
      if (!enc || enc.status !== "DRAFT") throw new TRPCError({ code: "FORBIDDEN" })

      // Normalize legacy (single-study) shape into the new items array.
      const items =
        input.items ??
        (input.tipoImagen && input.region
          ? [{ tipoImagen: input.tipoImagen, region: input.region }]
          : null)
      if (!items || items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Debe indicar al menos un estudio.",
        })
      }

      return ctx.db.imagingOrder.create({
        data: {
          encounterId: input.encounterId,
          urgente: input.urgente,
          indicacionesClinicas: input.indicacionesClinicas,
          // Seed the legacy single-value fields with the first item so
          // backfills and any old code paths that read them still work.
          tipoImagen: items[0].tipoImagen,
          region: items[0].region,
          items: {
            create: items.map((it, i) => ({
              tipoImagen: it.tipoImagen,
              region: it.region,
              notas: it.notas,
              orden: i,
            })),
          },
        },
        include: { items: { orderBy: { orden: "asc" } } },
      })
    }),

  addAddendum: doctorProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        texto: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
      if (!enc) throw new TRPCError({ code: "NOT_FOUND" })
      if (enc.status === "DRAFT")
        throw new TRPCError({ code: "FORBIDDEN", message: "Firme la consulta antes de agregar una adenda." })

      return ctx.db.$transaction(async (tx) => {
        const doc = await tx.document.create({
          data: {
            encounterId: input.encounterId,
            patientRegistrationId: input.patientRegistrationId,
            tipo: "INFORME",
            contenidoHtml: `<p><strong>ADENDA:</strong></p><p>${input.texto}</p>`,
            firmadoAt: new Date(),
            firmadoPor: ctx.session.doctorId,
          },
        })
        await tx.encounter.update({
          where: { id: input.encounterId },
          data: { status: "AMENDED" },
        })
        return doc
      })
    }),

  /**
   * Express mode: copy clinical data from a previous encounter to the current one.
   *
   * Copies (per patient and doctor):
   *   - motivo, historiaClinica (encrypted), plan (encrypted)
   *   - vitales, examenFisico
   *   - diagnoses (with their tipo)
   *   - prescription items (medication + concentration + dose + freq + duration)
   *
   * Does NOT copy: lab orders, imaging orders, documents, signed dates.
   * The doctor can re-order those manually if needed.
   */
  copyFromLast: doctorProcedure
    .input(
      z.object({
        fromEncounterId: z.string(),
        toEncounterId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [from, to] = await Promise.all([
        ctx.db.encounter.findFirst({
          where: {
            id: input.fromEncounterId,
            workspaceId: ctx.session.workspaceId,
          },
          include: {
            diagnoses: { orderBy: { createdAt: "asc" } },
            prescriptions: {
              include: { items: { include: { medication: true } } },
              orderBy: { createdAt: "desc" },
            },
          },
        }),
        ctx.db.encounter.findFirst({
          where: {
            id: input.toEncounterId,
            workspaceId: ctx.session.workspaceId,
          },
        }),
      ])
      if (!from || !to) throw new TRPCError({ code: "NOT_FOUND" })
      if (to.status !== "DRAFT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo se puede aplicar a consultas en borrador.",
        })
      }
      if (from.patientRegistrationId !== to.patientRegistrationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Las consultas son de pacientes diferentes.",
        })
      }

      // Find the latest prescription of `from` (most recent).
      const sourcePrescription = from.prescriptions?.[0]

      await ctx.db.$transaction(async (tx) => {
        // Update encounter text fields.
        // motivo must be re-encrypted via packEncounterMotivo â€” never copy
        // plaintext across encounters. The legacy plaintext `motivo` column
        // was dropped in 20260703010000_drop_encounter_motivo_legacy; we
        // re-encrypt from the source's motivoCifrado via readEncounterMotivo.
        const copiedMotivo = packEncounterMotivo({ motivo: readEncounterMotivo(from) })
        await tx.encounter.update({
          where: { id: input.toEncounterId },
          data: {
            motivoCifrado: copiedMotivo.motivoCifrado,
            motivoHmac: copiedMotivo.motivoHmac,
            historiaClinica: from.historiaClinicaCifrada ?? from.historiaClinica,
            historiaClinicaCifrada: from.historiaClinicaCifrada,
            plan: from.planCifrado ?? from.plan,
            planCifrado: from.planCifrado,
            vitales: from.vitales ?? Prisma.JsonNull,
            examenFisico: from.examenFisico ?? Prisma.JsonNull,
          },
        })

        // Copy diagnoses.
        if (from.diagnoses.length > 0) {
          await tx.diagnosis.createMany({
            data: from.diagnoses.map((d) => ({
              encounterId: input.toEncounterId,
              codigoCie10: d.codigoCie10,
              descripcion: d.descripcion,
              tipo: d.tipo,
            })),
          })
        }

        // Copy prescription + items.
        if (sourcePrescription && sourcePrescription.items.length > 0) {
          const newPres = await tx.prescription.create({
            data: { encounterId: input.toEncounterId },
          })
          await tx.prescriptionItem.createMany({
            data: sourcePrescription.items.map((it) => ({
              prescriptionId: newPres.id,
              medicationId: it.medicationId,
              concentracion: it.concentracion,
              dosis: it.dosis,
              frecuencia: it.frecuencia,
              duracion: it.duracion,
              indicacionesEspeciales: it.indicacionesEspeciales,
            })),
          })
        }
      })

      await audit("CREATE_ENCOUNTER", {
        userId: ctx.session.id,
        userRole: "DOCTOR",
        workspaceId: ctx.session.workspaceId,
        resourceType: "Encounter",
        resourceId: input.toEncounterId,
        patientId: to.patientRegistrationId,
        metadata: { action: "copyFromLast", fromId: input.fromEncounterId },
      })
      return { ok: true }
    }),

  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const encounter = await ctx.db.encounter.findUnique({
        where: { id: input.id },
      })
      if (!encounter || encounter.workspaceId !== ctx.session.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      await ctx.db.encounter.delete({
        where: { id: input.id },
      })

      await audit("ENCOUNTER_DELETED", {
        userId: ctx.session.id,
        userRole: "DOCTOR",
        workspaceId: ctx.session.workspaceId,
        resourceType: "Encounter",
        resourceId: input.id,
        patientId: encounter.patientRegistrationId,
        outcome: "ALLOWED",
        channel: "UI",
      })

      return { success: true }
    }),

  reopen: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const encounter = await ctx.db.encounter.findUnique({
        where: { id: input.id },
      })
      if (!encounter || encounter.workspaceId !== ctx.session.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      await ctx.db.encounter.update({
        where: { id: input.id },
        data: { status: "DRAFT" },
      })

      await audit("ENCOUNTER_REOPENED", {
        userId: ctx.session.id,
        userRole: "DOCTOR",
        workspaceId: ctx.session.workspaceId,
        resourceType: "Encounter",
        resourceId: input.id,
        patientId: encounter.patientRegistrationId,
        outcome: "ALLOWED",
        channel: "UI",
      })

      return { success: true }
    }),

  saveScale: doctorProcedure
    .input(
      z.object({
        encounterId: z.string(),
        tipo: z.enum(["WOMAC", "QUICKDASH", "IKDC"]),
        valores: z.any(),
        puntuacion: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findUnique({
        where: { id: input.encounterId },
      })
      if (!enc || enc.workspaceId !== ctx.session.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      const existing = await ctx.db.encounterScale.findFirst({
        where: { encounterId: input.encounterId, tipo: input.tipo },
      })

      if (existing) {
        return ctx.db.encounterScale.update({
          where: { id: existing.id },
          data: {
            valores: input.valores,
            puntuacion: input.puntuacion,
          },
        })
      } else {
        return ctx.db.encounterScale.create({
          data: {
            encounterId: input.encounterId,
            tipo: input.tipo,
            valores: input.valores,
            puntuacion: input.puntuacion,
          },
        })
      }
    }),

  listCrossWorkspace: doctorProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        include: { patient: true },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      if (!reg.patient.hmacCedula) return [] // Only works for patients with cédula

      const rows = await ctx.db.encounter.findMany({
        where: {
          patientRegistration: {
            patient: {
              hmacCedula: reg.patient.hmacCedula,
              tipoIdentificacion: reg.patient.tipoIdentificacion,
            }
          },
          workspace: {
            doctorId: ctx.session.doctorId,
          },
          workspaceId: { not: ctx.session.workspaceId },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          status: true,
          motivoCifrado: true,
          workspace: { select: { nombre: true } },
          diagnoses: { select: { codigoCie10: true, descripcion: true } },
          _count: { select: { prescriptions: true } },
        },
      })

      return rows.map((e) => {
        const { motivoCifrado: _drop, ...rest } = e
        return {
          ...rest,
          motivo: readEncounterMotivo({ motivoCifrado: e.motivoCifrado }) ?? null,
        }
      })
    }),

  getCrossWorkspace: doctorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findFirst({
        where: { 
          id: input.id, 
          workspace: { doctorId: ctx.session.doctorId },
          workspaceId: { not: ctx.session.workspaceId },
        },
        include: {
          workspace: { select: { nombre: true } },
          diagnoses: { orderBy: { createdAt: "asc" } },
          prescriptions: {
            include: { items: { include: { medication: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      })
      if (!enc) throw new TRPCError({ code: "NOT_FOUND" })

      void audit("VIEW_ENCOUNTER", {
        userId: ctx.session.id,
        userRole: ctx.session.role,
        workspaceId: ctx.session.workspaceId,
        resourceType: "Encounter",
        resourceId: enc.id,
        patientId: enc.patientRegistrationId,
      })

      return {
        ...enc,
        motivo: readEncounterMotivo(enc) ?? null,
        historiaClinica: enc.historiaClinicaCifrada ? safeDecrypt(enc.historiaClinicaCifrada) ?? enc.historiaClinica ?? null : enc.historiaClinica ?? null,
        plan: enc.planCifrado ? safeDecrypt(enc.planCifrado) ?? enc.plan ?? null : enc.plan ?? null,
      }
    }),
})

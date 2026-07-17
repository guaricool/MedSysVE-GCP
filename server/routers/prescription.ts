import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { headers } from "next/headers"
import { router, doctorProcedure } from "../trpc"
import { checkAllergyConflict, type DrugAllergy } from "@/lib/drug-allergies"
import { auditFromHeaders } from "@/lib/audit"

const itemInput = z.object({
  medicationId: z.string(),
  concentracion: z.string(),
  dosis: z.string(),
  frecuencia: z.string(),
  duracion: z.string(),
  indicacionesEspeciales: z.string().optional(),
  overrideAlerta: z.boolean().default(false),
})

/**
 * Audit a drug-allergy interaction that the doctor explicitly overrode.
 * Captured separately from the regular "Override" audit so that the
 * PHI disclosure / clinical override trail is reviewable. Severity is
 * embedded in the message body.
 */
async function auditAllergyOverride(args: {
  session: { id: string; workspaceId: string; role?: string }
  patientRegistrationId: string
  medicationName: string
  medicationId: string
  allergySustancia: string
  allergyGravedad: "LEVE" | "MODERADA" | "SEVERA"
  matchType: "exact" | "family" | "synonym"
  family?: string
  prescriptionItemId: string
  reason?: string | null
  headers: Headers
}) {
  await auditFromHeaders(
    "ALLERGY_OVERRIDE",
    {
      userId: args.session.id,
      userRole: args.session.role ?? "DOCTOR",
      workspaceId: args.session.workspaceId,
      resourceType: "PrescriptionItem",
      resourceId: args.prescriptionItemId,
      channel: "API",
      metadata: {
        patientRegistrationId: args.patientRegistrationId,
        medicationId: args.medicationId,
        medicationName: args.medicationName,
        allergySustancia: args.allergySustancia,
        allergyGravedad: args.allergyGravedad,
        matchType: args.matchType,
        family: args.family ?? null,
        reason: args.reason ?? null,
      },
    },
    args.headers,
  )
}

/**
 * Resolve the patient's active allergies and the medication the doctor
 * is trying to add. Returns a non-null AllergyMatch if there's a conflict
 * the caller must escalate (either reject the request or require an
 * override). Returns null when no conflict exists.
 *
 * Defense-in-depth: the UI already runs this same check before submitting,
 * but the server is the authoritative gate. The UI can be bypassed; the
 * server cannot.
 */
async function evaluateAllergyConflict(args: {
  db: any
  patientRegistrationId: string
  medicationId: string
}): Promise<
  | { conflict: true; match: NonNullable<ReturnType<typeof checkAllergyConflict>>; medication: { nombreGenerico: string; nombresComerciales: string[] } }
  | { conflict: false }
> {
  const medication = await args.db.medication.findFirst({
    where: { id: args.medicationId },
    select: { nombreGenerico: true, nombresComerciales: true, workspaceId: true },
  })
  if (!medication) {
    // Medication was deleted between search and submit. The unique index
    // on the FK would catch this at insert time anyway, so let the insert
    // surface the real error.
    return { conflict: false }
  }

  const allergies = await args.db.alergia.findMany({
    where: {
      patientRegistrationId: args.patientRegistrationId,
      activa: true,
    },
    select: { sustancia: true, reaccion: true, gravedad: true },
  })
  if (allergies.length === 0) return { conflict: false }

  const match = checkAllergyConflict(
    {
      nombreGenerico: medication.nombreGenerico,
      nombresComerciales: medication.nombresComerciales,
    },
    allergies as DrugAllergy[],
  )
  if (!match) return { conflict: false }
  return { conflict: true, match, medication }
}

export const prescriptionRouter = router({
  create: doctorProcedure
    .input(z.object({ encounterId: z.string(), items: z.array(itemInput).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.encounterId, workspaceId: ctx.session.workspaceId },
        select: { id: true, status: true, patientRegistrationId: true },
      })
      if (!enc || enc.status !== "DRAFT") throw new TRPCError({ code: "FORBIDDEN" })

      // Drug-allergy pre-flight. Any item with a SEVERA conflict must
      // carry overrideAlerta=true. LEVE/MODERADA conflicts are also blocked
      // without override, but the doctor can choose to override them too.
      for (const it of input.items) {
        const evalRes = await evaluateAllergyConflict({
          db: ctx.db,
          patientRegistrationId: enc.patientRegistrationId,
          medicationId: it.medicationId,
        })
        if (evalRes.conflict && !it.overrideAlerta) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Alergia del paciente contraindica ${evalRes.medication.nombreGenerico}: ${evalRes.match.warning} Reenvía con overrideAlerta=true si confirmas la indicación.`,
          })
        }
      }

      return ctx.db.prescription.create({
        data: {
          encounterId: input.encounterId,
          items: { create: input.items },
        },
        include: { items: { include: { medication: true } } },
      })
    }),

  addItem: doctorProcedure
    .input(z.object({ prescriptionId: z.string(), item: itemInput }))
    .mutation(async ({ ctx, input }) => {
      const presc = await ctx.db.prescription.findFirst({
        where: { id: input.prescriptionId },
        include: { encounter: { select: { workspaceId: true, status: true, patientRegistrationId: true } } },
      })
      if (!presc || presc.encounter.workspaceId !== ctx.session.workspaceId)
        throw new TRPCError({ code: "FORBIDDEN" })
      if (presc.encounter.status !== "DRAFT")
        throw new TRPCError({ code: "FORBIDDEN", message: "Consulta firmada." })

      // Defense in depth: re-check the allergy gate here even if the UI
      // already ran the check. The UI can be bypassed (DevTools, custom
      // client); the server is the final authority.
      const evalRes = await evaluateAllergyConflict({
        db: ctx.db,
        patientRegistrationId: presc.encounter.patientRegistrationId,
        medicationId: input.item.medicationId,
      })
      if (evalRes.conflict && !input.item.overrideAlerta) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Alergia del paciente contraindica ${evalRes.medication.nombreGenerico}: ${evalRes.match.warning} Reenvía con overrideAlerta=true si confirmas la indicación.`,
        })
      }

      const created = await ctx.db.prescriptionItem.create({
        data: { prescriptionId: input.prescriptionId, ...input.item },
        include: { medication: true },
      })

      if (evalRes.conflict && input.item.overrideAlerta) {
        // Doctor overrode an allergy warning. Audit it so the clinical
        // and compliance trail is complete.
        const headersList = await headers()
        await auditAllergyOverride({
          session: {
            id: ctx.session.id,
            workspaceId: ctx.session.workspaceId,
            role: ctx.session.role,
          },
          patientRegistrationId: presc.encounter.patientRegistrationId,
          medicationName: evalRes.medication.nombreGenerico,
          medicationId: input.item.medicationId,
          allergySustancia: evalRes.match.allergy.sustancia,
          allergyGravedad: evalRes.match.severity,
          matchType: evalRes.match.matchType,
          family: evalRes.match.family,
          prescriptionItemId: created.id,
          reason: input.item.indicacionesEspeciales ?? null,
          headers: headersList,
        })
      }

      return created
    }),

  removeItem: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.prescriptionItem.findFirst({
        where: { id: input.id },
        include: {
          prescription: {
            include: { encounter: { select: { workspaceId: true, status: true } } },
          },
        },
      })
      if (!item || item.prescription.encounter.workspaceId !== ctx.session.workspaceId)
        throw new TRPCError({ code: "FORBIDDEN" })
      if (item.prescription.encounter.status !== "DRAFT")
        throw new TRPCError({ code: "FORBIDDEN", message: "Consulta firmada." })
      return ctx.db.prescriptionItem.delete({ where: { id: input.id } })
    }),

  createOrGet: doctorProcedure
    .input(z.object({ encounterId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
      if (!enc || enc.status !== "DRAFT") throw new TRPCError({ code: "FORBIDDEN" })

      const existing = await ctx.db.prescription.findFirst({
        where: { encounterId: input.encounterId, encounter: { workspaceId: ctx.session.workspaceId } },
        include: { items: { include: { medication: true } } },
      })
      if (existing) return existing

      return ctx.db.prescription.create({
        data: { encounterId: input.encounterId },
        include: { items: { include: { medication: true } } },
      })
    }),

})

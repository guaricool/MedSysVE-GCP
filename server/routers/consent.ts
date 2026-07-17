import { z } from "zod"
import { router, protectedProcedure, doctorProcedure } from "../trpc"

// Audit S7 (2026-07-06): listTemplates and createConsent migrated from
// protectedProcedure to doctorProcedure. Template management is doctor-only
// (clinical workflow configuration). Patient-facing operations
// (listPatientConsents, signConsent) remain protectedProcedure because
// patients use them through the portal to review and sign their consents.
export const consentRouter = router({
  // --- Templates ---

  listTemplates: doctorProcedure.query(async ({ ctx }) => {
    return (ctx.db as any).consentTemplate.findMany({
      where: { workspaceId: ctx.session.workspaceId },
      orderBy: { titulo: "asc" },
    })
  }),

  createTemplate: doctorProcedure
    .input(z.object({ titulo: z.string().min(1), contenido: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return (ctx.db as any).consentTemplate.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          titulo: input.titulo,
          contenido: input.contenido,
        },
      })
    }),

  updateTemplate: doctorProcedure
    .input(
      z.object({
        id: z.string(),
        titulo: z.string().min(1).optional(),
        contenido: z.string().optional(),
        activo: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const tpl = await (ctx.db as any).consentTemplate.findFirst({
        where: { id, workspaceId: ctx.session.workspaceId },
      })
      if (!tpl) throw new Error("Plantilla no encontrada")
      return (ctx.db as any).consentTemplate.update({ where: { id }, data })
    }),

  // --- Patient consents ---

  listPatientConsents: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return (ctx.db as any).patientConsent.findMany({
        where: {
          workspaceId: ctx.session.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
        },
        include: { template: { select: { id: true, titulo: true } } },
        orderBy: { createdAt: "desc" },
      })
    }),

  createConsent: doctorProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        templateId: z.string(),
        encounterId: z.string().optional(),
        notas: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!patient) throw new Error("Paciente no encontrado")
      return (ctx.db as any).patientConsent.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
          templateId: input.templateId,
          encounterId: input.encounterId ?? null,
          notas: input.notas ?? null,
        },
        include: { template: { select: { id: true, titulo: true } } },
      })
    }),

  signConsent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        firmaData: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return (ctx.db as any).patientConsent.update({
        where: { id: input.id },
        data: {
          firmado: true,
          firmadoAt: new Date(),
          firmaData: input.firmaData ?? null,
        },
      })
    }),
})

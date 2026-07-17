import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"

export const alergiaRouter = router({
  // Audit S5 (2026-07-06): list migrated from protectedProcedure to
  // doctorProcedure for consistency with add/delete. Per PERMISSIONS.md
  // Gap #5, staff (SECRETARY/ASSISTANT/NURSE) does not have login yet,
  // so only DOCTOR should access this clinical data.
  list: doctorProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        select: { id: true },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.alergia.findMany({
        where: { patientRegistrationId: input.patientRegistrationId },
        orderBy: { createdAt: "asc" },
      })
    }),

  add: doctorProcedure
    .input(z.object({
      patientRegistrationId: z.string(),
      sustancia: z.string().min(1).max(200),
      reaccion: z.string().max(500).optional(),
      gravedad: z.enum(["LEVE", "MODERADA", "SEVERA"]).default("LEVE"),
    }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        select: { id: true },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.alergia.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
          sustancia: input.sustancia,
          reaccion: input.reaccion,
          gravedad: input.gravedad,
        },
      })
    }),

  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const al = await ctx.db.alergia.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!al) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.alergia.delete({ where: { id: input.id } })
    }),
})

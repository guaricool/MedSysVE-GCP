import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"

export const vaccineRouter = router({
  // Audit S5 (2026-07-06): ALL procedures migrated from protectedProcedure
  // to doctorProcedure. add and remove were clinical mutations that any
  // authenticated user could call (PATIENT, etc.) — clear gap.
  list: doctorProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.vaccine.findMany({
        where: { patientRegistrationId: input.patientRegistrationId },
        orderBy: { fechaAplicacion: "asc" },
      })
    }),

  add: doctorProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        vacuna: z.string().min(2).max(120),
        fechaAplicacion: z.string(),
        dosis: z.string().optional(),
        lote: z.string().optional(),
        proximaDosis: z.string().optional(),
        notas: z.string().optional(),
        aplicadoPor: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.vaccine.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
          vacuna: input.vacuna,
          fechaAplicacion: new Date(input.fechaAplicacion),
          dosis: input.dosis,
          lote: input.lote,
          proximaDosis: input.proximaDosis ? new Date(input.proximaDosis) : null,
          notas: input.notas,
          aplicadoPor: input.aplicadoPor,
        },
      })
    }),

  remove: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const vac = await ctx.db.vaccine.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!vac) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.vaccine.delete({ where: { id: input.id } })
    }),

})

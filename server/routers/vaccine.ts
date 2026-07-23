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

  addMany: doctorProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        vaccines: z.array(
          z.object({
            vacuna: z.string().min(2).max(120),
            fechaAplicacion: z.string(),
            dosis: z.string().optional(),
            lote: z.string().optional(),
            proximaDosis: z.string().optional(),
            notas: z.string().optional(),
            aplicadoPor: z.string().optional(),
          })
        )
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })

      const data = input.vaccines.map((v) => ({
        workspaceId: ctx.session.workspaceId,
        patientRegistrationId: input.patientRegistrationId,
        vacuna: v.vacuna,
        fechaAplicacion: new Date(v.fechaAplicacion),
        dosis: v.dosis || null,
        lote: v.lote || null,
        proximaDosis: v.proximaDosis ? new Date(v.proximaDosis) : null,
        notas: v.notas || null,
        aplicadoPor: v.aplicadoPor || null,
      }))

      return ctx.db.vaccine.createMany({ data })
    }),

})

import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"

const COLOR_OPTIONS = ["blue", "green", "yellow", "red", "purple", "pink", "orange", "slate"] as const

export const tagRouter = router({
  // Audit S5 (2026-07-06): list migrated from protectedProcedure to
  // doctorProcedure for consistency with add/delete.
  list: doctorProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "FORBIDDEN" })
      return ctx.db.patientTag.findMany({
        where: { patientRegistrationId: input.patientRegistrationId },
        orderBy: { createdAt: "asc" },
      })
    }),

  add: doctorProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        etiqueta: z.string().min(1).max(50),
        color: z.enum(COLOR_OPTIONS).default("blue"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "FORBIDDEN" })
      return ctx.db.patientTag.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
          etiqueta: input.etiqueta,
          color: input.color,
        },
      })
    }),

  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tag = await ctx.db.patientTag.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!tag) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.patientTag.delete({ where: { id: input.id } })
    }),
})

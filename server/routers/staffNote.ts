import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"

export const staffNoteRouter = router({
  // Audit S5 (2026-07-06) — closes PERMISSIONS.md Gap #5 (partial):
  // ALL three procedures migrated from protectedProcedure to doctorProcedure.
  // Staff (SECRETARY/ASSISTANT/NURSE) doesn't have login yet, so only
  // DOCTOR can access these. When staff login is added, introduce a new
  // `staffProcedure` with PIN-based auth and split these appropriately.
  list: doctorProcedure.query(async ({ ctx }) => {
    return ctx.db.staffNote.findMany({
      where: { workspaceId: ctx.session.workspaceId },
      orderBy: { creadoAt: "desc" },
      take: 50,
    })
  }),

  add: doctorProcedure
    .input(z.object({ texto: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const autorNombre =
        ctx.session.nombre && ctx.session.apellido
          ? `${ctx.session.nombre} ${ctx.session.apellido}`
          : ctx.session.email

      return ctx.db.staffNote.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          autorId: ctx.session.id,
          autorNombre,
          texto: input.texto,
        },
      })
    }),

  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.staffNote.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!note) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.staffNote.delete({ where: { id: input.id } })
    }),
})

import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"

export const announcementRouter = router({
  list: doctorProcedure.query(async ({ ctx }) => {
    return ctx.db.announcement.findMany({
      where: { workspaceId: ctx.session.workspaceId },
      orderBy: { creadoAt: "desc" },
      take: 50,
    })
  }),

  create: doctorProcedure
    .input(z.object({ titulo: z.string().min(1).max(100), mensaje: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.announcement.create({
        data: { workspaceId: ctx.session.workspaceId, titulo: input.titulo, mensaje: input.mensaje },
      })
    }),

  toggle: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ann = await ctx.db.announcement.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!ann) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.announcement.update({ where: { id: input.id }, data: { activo: !ann.activo } })
    }),

  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ann = await ctx.db.announcement.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!ann) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.announcement.delete({ where: { id: input.id } })
    }),
})

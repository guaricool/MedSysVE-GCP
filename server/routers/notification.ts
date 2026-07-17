import { z } from "zod"
import { router, protectedProcedure } from "../trpc"

export const notificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.findMany({
      where: { workspaceId: ctx.session.workspaceId },
      orderBy: { createdAt: "desc" },
      take: 40,
    })
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: { workspaceId: ctx.session.workspaceId, leida: false },
    })
    return { count }
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notification.updateMany({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
        data: { leida: true },
      })
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.notification.updateMany({
      where: { workspaceId: ctx.session.workspaceId, leida: false },
      data: { leida: true },
    })
  }),
})

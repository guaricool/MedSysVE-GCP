import { z } from "zod"
import { router, doctorProcedure } from "../trpc"

export const auditRouter = router({
  list: doctorProcedure
    .input(
      z.object({
        entidad: z.string().optional(),
        actorId: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        take: z.number().int().min(1).max(200).default(50),
        skip: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        workspaceId: ctx.session.workspaceId,
      }
      if (input.entidad) where.entidad = input.entidad
      if (input.actorId) where.actorId = input.actorId
      if (input.from || input.to) {
        where.createdAt = {
          ...(input.from ? { gte: new Date(input.from) } : {}),
          ...(input.to ? { lte: new Date(input.to) } : {}),
        }
      }
      return (ctx.db as any).auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.take,
        skip: input.skip,
      })
    }),
})

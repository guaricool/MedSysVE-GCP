import { z } from "zod"
import { router, protectedProcedure } from "../trpc"

export const expressOrderRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        tipo: z.enum(["RECETA", "LABORATORIO", "IMAGEN"]),
        pacienteNombre: z.string().min(1),
        pacienteApellido: z.string().min(1),
        pacienteCedula: z.string().optional(),
        pacienteEdad: z.number().int().min(0),
        pacienteSexo: z.string().optional(),
        items: z.any(), // JSON representation of studies or prescriptions
        diagnosticos: z.string().optional(),
        indicaciones: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.expressOrder.create({
        data: {
          tipo: input.tipo,
          pacienteNombre: input.pacienteNombre,
          pacienteApellido: input.pacienteApellido,
          pacienteCedula: input.pacienteCedula || null,
          pacienteEdad: input.pacienteEdad,
          pacienteSexo: input.pacienteSexo || null,
          items: input.items,
          diagnosticos: input.diagnosticos || null,
          indicaciones: input.indicaciones || null,
          workspaceId: ctx.session.workspaceId,
        },
      })
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.expressOrder.findMany({
      where: { workspaceId: ctx.session.workspaceId },
      orderBy: { createdAt: "desc" },
    })
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.expressOrder.delete({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
    }),
})

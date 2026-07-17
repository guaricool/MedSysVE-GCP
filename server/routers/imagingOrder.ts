import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"

export const imagingOrderRouter = router({
  updateResult: doctorProcedure
    .input(
      z.object({
        id: z.string(),
        resultadoUrl: z.string().url().optional(),
        resultadoNotas: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const io = await ctx.db.imagingOrder.findFirst({
        where: { id: input.id },
        include: { encounter: { select: { workspaceId: true, patientRegistrationId: true } } },
      })
      if (!io || io.encounter.workspaceId !== ctx.session.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }
      const updated = await ctx.db.imagingOrder.update({
        where: { id: input.id },
        data: {
          resultadoUrl: input.resultadoUrl ?? null,
          resultadoNotas: input.resultadoNotas ?? null,
        },
      })
      if (input.resultadoUrl) {
        void ctx.db.notification.create({
          data: {
            workspaceId: ctx.session.workspaceId,
            tipo: "IMAGING_RESULT",
            titulo: "Resultado de imagenología disponible",
            mensaje: `Se cargó el resultado de ${io.tipoImagen} — ${io.region}.`,
            referenciaId: io.id,
          },
        })
      }
      return updated
    }),
})

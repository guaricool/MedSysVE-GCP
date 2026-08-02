import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"
import { ensureDbSchema } from "@/lib/db"

export const alergiaRouter = router({
  list: doctorProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ensureDbSchema()
      try {
        const reg = await ctx.db.patientRegistration.findFirst({
          where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
          select: { id: true },
        })
        if (!reg) return []
        return await ctx.db.alergia.findMany({
          where: { patientRegistrationId: input.patientRegistrationId },
          orderBy: { createdAt: "asc" },
        })
      } catch (err) {
        console.warn("[alergia.list] Query warning:", err)
        return []
      }
    }),

  add: doctorProcedure
    .input(z.object({
      patientRegistrationId: z.string(),
      sustancia: z.string().min(1).max(200),
      reaccion: z.string().max(500).optional(),
      categoria: z.enum(["FARMACO", "ALIMENTO", "AEROALERGENO", "INSECTO", "CONTACTO", "OTRO"]).optional(),
      gravedad: z.enum(["LEVE", "MODERADA", "SEVERA"]).default("LEVE"),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureDbSchema()
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        select: { id: true },
      })
      if (!reg) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado en este consultorio." })
      }

      try {
        return await ctx.db.alergia.create({
          data: {
            workspaceId: ctx.session.workspaceId,
            patientRegistrationId: input.patientRegistrationId,
            sustancia: input.sustancia,
            reaccion: input.reaccion,
            categoria: input.categoria,
            gravedad: input.gravedad,
          },
        })
      } catch (err) {
        console.warn("[alergia.add] Initial creation error, triggering ensureDbSchema(true) self-healing retry:", err)
        await ensureDbSchema(true)
        try {
          return await ctx.db.alergia.create({
            data: {
              workspaceId: ctx.session.workspaceId,
              patientRegistrationId: input.patientRegistrationId,
              sustancia: input.sustancia,
              reaccion: input.reaccion,
              categoria: input.categoria,
              gravedad: input.gravedad,
            },
          })
        } catch (retryErr: any) {
          console.error("[alergia.add] Failed to create allergy after schema repair:", retryErr)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No se pudo guardar la alergia del paciente. Por favor intente nuevamente.",
            cause: retryErr,
          })
        }
      }
    }),

  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ensureDbSchema()
      try {
        const al = await ctx.db.alergia.findFirst({
          where: { id: input.id, workspaceId: ctx.session.workspaceId },
        })
        if (!al) throw new TRPCError({ code: "NOT_FOUND", message: "Alergia no encontrada." })
        return await ctx.db.alergia.delete({ where: { id: input.id } })
      } catch (err: any) {
        console.error("[alergia.delete] Error deleting allergy:", err)
        if (err instanceof TRPCError) throw err
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No se pudo eliminar la alergia.",
          cause: err,
        })
      }
    }),
})

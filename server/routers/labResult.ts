import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, protectedProcedure, doctorProcedure } from "../trpc"
import { Prisma } from "@prisma/client"

/**
 * Structured lab value entry.
 * `interpretado` is one of: NORMAL, BAJO, ALTO, CRITICO (computed by the
 * UI by comparing against rangoReferencia).
 */
const LabValueSchema = z.object({
  parametro: z.string().min(1).max(80),
  valor: z.string().min(1).max(40),
  unidad: z.string().max(20).optional().nullable(),
  rangoReferencia: z.string().max(80).optional().nullable(),
  interpretado: z.enum(["NORMAL", "BAJO", "ALTO", "CRITICO"]).optional().nullable(),
})

export const labResultRouter = router({
  save: doctorProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        encounterId: z.string().optional(),
        titulo: z.string().min(1).max(200),
        fecha: z.string(),
        resultado: z.string().min(1),
        // Optional structured values
        valores: z.array(LabValueSchema).max(50).optional(),
        notas: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.labResult.create({
        data: {
          patientRegistrationId: input.patientRegistrationId,
          encounterId: input.encounterId,
          titulo: input.titulo,
          fecha: new Date(input.fecha),
          resultado: input.resultado,
          valores: input.valores as Prisma.InputJsonValue | undefined,
          notas: input.notas,
        },
      })
    }),

  // Audit S5 (2026-07-06): list migrated from protectedProcedure to
  // doctorProcedure for consistency with save/delete.
  list: doctorProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.labResult.findMany({
        where: { patientRegistrationId: input.patientRegistrationId },
        orderBy: { fecha: "desc" },
        take: 50,
      })
    }),

  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.labResult.findFirst({
        where: { id: input.id },
        include: {
          patientRegistration: { select: { workspaceId: true } },
        },
      })
      if (!result || result.patientRegistration.workspaceId !== ctx.session.workspaceId) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }
      return ctx.db.labResult.delete({ where: { id: input.id } })
    }),
})

import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"

const DOC_TIPOS = ["INFORME", "REPOSO", "REFERIDO", "CERTIFICADO", "RECETA"] as const

export const templateRouter = router({
  list: doctorProcedure
    .input(z.object({ especialidad: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.encounterTemplate.findMany({
        where: {
          workspaceId: ctx.session.workspaceId,
          OR: [
            { especialidad: null },
            input?.especialidad ? { especialidad: input.especialidad } : {},
          ],
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  save: doctorProcedure
    .input(
      z.object({
        nombre: z.string().min(1).max(100),
        descripcion: z.string().nullish(),
        motivo: z.string().nullish(),
        historiaClinica: z.string().nullish(),
        plan: z.string().nullish(),
        examenFisico: z.preprocess(
          (val) => {
            if (typeof val === "string") {
              try { return JSON.parse(val) } catch { return val }
            }
            return val
          },
          z.any().optional()
        ),
        datosEspecialidad: z.preprocess(
          (val) => {
            if (typeof val === "string") {
              try { return JSON.parse(val) } catch { return val }
            }
            return val
          },
          z.any().optional()
        ),
        especialidad: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.encounterTemplate.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          nombre: input.nombre,
          descripcion: input.descripcion ?? null,
          motivo: input.motivo ?? null,
          historiaClinica: input.historiaClinica ?? null,
          plan: input.plan ?? null,
          examenFisico: input.examenFisico ?? null,
          datosEspecialidad: input.datosEspecialidad ?? null,
          especialidad: input.especialidad ?? null,
        },
      })
    }),

  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tmpl = await ctx.db.encounterTemplate.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!tmpl) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.encounterTemplate.delete({ where: { id: input.id } })
    }),

  // --- Document templates ---

  listDoc: doctorProcedure
    .input(
      z.object({
        tipo: z.enum(DOC_TIPOS),
        especialidad: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.documentTemplate.findMany({
        where: {
          workspaceId: ctx.session.workspaceId,
          tipo: input.tipo,
          OR: [
            { especialidad: null },
            input.especialidad ? { especialidad: input.especialidad } : {},
          ],
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveDoc: doctorProcedure
    .input(
      z.object({
        tipo: z.enum(DOC_TIPOS),
        nombre: z.string().min(1).max(100),
        contenidoHtml: z.string().min(1),
        especialidad: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.documentTemplate.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          tipo: input.tipo,
          nombre: input.nombre,
          contenidoHtml: input.contenidoHtml,
          especialidad: input.especialidad || null,
        },
      })
    }),

  deleteDoc: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tmpl = await ctx.db.documentTemplate.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!tmpl) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.documentTemplate.delete({ where: { id: input.id } })
    }),
})

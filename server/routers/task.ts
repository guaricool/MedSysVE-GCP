import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"

// Audit S7 (2026-07-06): all 6 procedures migrated from protectedProcedure
// to doctorProcedure. Tasks are workspace-internal team coordination
// (assigned to Staff records — no PATIENT role participation). Since
// staff doesn't have login yet (Gap #5 in PERMISSIONS.md), only DOCTOR
// can manage tasks. When staff login is added, a new staffProcedure will
// be introduced and read-only list can be opened to SECRETARY/ASSISTANT.
const priorityEnum = z.enum(["ALTA", "MEDIA", "BAJA"])

export const taskRouter = router({
  list: doctorProcedure
    .input(z.object({ completada: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.task.findMany({
        where: {
          workspaceId: ctx.session.workspaceId,
          ...(input?.completada !== undefined ? { completada: input.completada } : {}),
        },
        include: {
          asignadoA: { select: { id: true, nombre: true, apellido: true, rol: true } },
          patientRegistration: {
            select: { id: true, idDisplay: true, patient: { select: { nombre: true, apellido: true } } },
          },
        },
        orderBy: [
          { completada: "asc" },
          { fechaVencimiento: "asc" },
          { prioridad: "asc" },
          { createdAt: "desc" },
        ],
      })
    }),

  create: doctorProcedure
    .input(
      z.object({
        titulo: z.string().min(1).max(200),
        descripcion: z.string().max(1000).optional(),
        prioridad: priorityEnum.default("MEDIA"),
        asignadoAId: z.string().optional(),
        patientRegistrationId: z.string().optional(),
        fechaVencimiento: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.asignadoAId) {
        const staff = await ctx.db.staff.findFirst({
          where: { id: input.asignadoAId, workspaceId: ctx.session.workspaceId, activo: true },
        })
        if (!staff) throw new TRPCError({ code: "NOT_FOUND", message: "Staff no encontrado" })
      }
      if (input.patientRegistrationId) {
        const reg = await ctx.db.patientRegistration.findFirst({
          where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        })
        if (!reg) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado" })
      }
      return ctx.db.task.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          titulo: input.titulo,
          descripcion: input.descripcion,
          prioridad: input.prioridad,
          asignadoAId: input.asignadoAId ?? null,
          patientRegistrationId: input.patientRegistrationId ?? null,
          fechaVencimiento: input.fechaVencimiento ? new Date(input.fechaVencimiento) : null,
        },
        include: {
          asignadoA: { select: { id: true, nombre: true, apellido: true, rol: true } },
          patientRegistration: {
            select: { id: true, idDisplay: true, patient: { select: { nombre: true, apellido: true } } },
          },
        },
      })
    }),

  complete: doctorProcedure
    .input(z.object({ id: z.string(), completada: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!task) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.task.update({
        where: { id: input.id },
        data: {
          completada: input.completada,
          completadaAt: input.completada ? new Date() : null,
        },
      })
    }),

  update: doctorProcedure
    .input(
      z.object({
        id: z.string(),
        titulo: z.string().min(1).max(200).optional(),
        descripcion: z.string().max(1000).optional(),
        prioridad: priorityEnum.optional(),
        asignadoAId: z.string().nullable().optional(),
        fechaVencimiento: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!task) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.task.update({
        where: { id: input.id },
        data: {
          ...(input.titulo !== undefined ? { titulo: input.titulo } : {}),
          ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
          ...(input.prioridad !== undefined ? { prioridad: input.prioridad } : {}),
          ...(input.asignadoAId !== undefined ? { asignadoAId: input.asignadoAId } : {}),
          ...(input.fechaVencimiento !== undefined
            ? { fechaVencimiento: input.fechaVencimiento ? new Date(input.fechaVencimiento) : null }
            : {}),
        },
      })
    }),

  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!task) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.task.delete({ where: { id: input.id } })
    }),
})

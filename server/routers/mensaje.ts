import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, protectedProcedure, portalProcedure } from "../trpc"

export const mensajeRouter = router({
  send: protectedProcedure
    .input(z.object({
      patientRegistrationId: z.string(),
      texto: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        select: { id: true },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.mensaje.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
          autor: "DOCTOR",
          texto: input.texto,
          leido: true,
        },
      })
    }),

  portalSend: portalProcedure
    .input(z.object({
      workspaceId: z.string(),
      texto: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { patientId: ctx.patientId, workspaceId: input.workspaceId },
        select: { id: true },
      })
      if (!reg) throw new TRPCError({ code: "FORBIDDEN" })
      const msg = await ctx.db.mensaje.create({
        data: {
          workspaceId: input.workspaceId,
          patientRegistrationId: reg.id,
          autor: "PATIENT",
          texto: input.texto,
        },
        include: { patientRegistration: { include: { patient: true } } },
      })

      const pat = msg.patientRegistration.patient
      void ctx.db.notification.create({
        data: {
          workspaceId: input.workspaceId,
          tipo: "PORTAL_MESSAGE",
          titulo: "Nuevo mensaje del portal",
          mensaje: `${pat.nombre} ${pat.apellido}: "${input.texto.slice(0, 80)}${input.texto.length > 80 ? "..." : ""}"`,
          referenciaId: reg.id,
        },
      })

      return msg
    }),

  list: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        select: { id: true },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.mensaje.findMany({
        where: { patientRegistrationId: input.patientRegistrationId },
        orderBy: { creadoAt: "asc" },
        take: 100,
      })
    }),

  portalList: portalProcedure
    .input(z.object({ workspaceId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const regs = await ctx.db.patientRegistration.findMany({
        where: {
          patientId: ctx.patientId,
          ...(input?.workspaceId ? { workspaceId: input.workspaceId } : {}),
        },
        select: { id: true },
      })
      const regIds = regs.map((r) => r.id)
      return ctx.db.mensaje.findMany({
        where: { patientRegistrationId: { in: regIds } },
        orderBy: { creadoAt: "desc" },
        take: 100,
      })
    }),

  markRead: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        select: { id: true },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.mensaje.updateMany({
        where: { patientRegistrationId: input.patientRegistrationId, autor: "PATIENT", leido: false },
        data: { leido: true },
      })
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.mensaje.count({
      where: { workspaceId: ctx.session.workspaceId, autor: "PATIENT", leido: false },
    })
    return { count }
  }),
})

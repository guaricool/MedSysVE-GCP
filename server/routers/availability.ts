import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure, publicProcedure } from "../trpc"

const SlotInput = z.object({
  diaSemana: z.number().int().min(0).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/),
  duracionMinutos: z.number().int().min(10).max(120).default(30),
  activo: z.boolean(),
})

export const availabilityRouter = router({
  getMySlots: doctorProcedure.query(async ({ ctx }) => {
    return ctx.db.doctorAvailability.findMany({
      where: { workspaceId: ctx.session.workspaceId },
      orderBy: { diaSemana: "asc" },
    })
  }),

  setSlots: doctorProcedure
    .input(z.array(SlotInput))
    .mutation(async ({ ctx, input }) => {
      for (const slot of input) {
        await ctx.db.doctorAvailability.upsert({
          where: {
            workspaceId_diaSemana: {
              workspaceId: ctx.session.workspaceId,
              diaSemana: slot.diaSemana,
            },
          },
          create: { workspaceId: ctx.session.workspaceId, ...slot },
          update: slot,
        })
      }
      return ctx.db.doctorAvailability.findMany({
        where: { workspaceId: ctx.session.workspaceId },
        orderBy: { diaSemana: "asc" },
      })
    }),

  getAvailableSlots: publicProcedure
    .input(z.object({ workspaceId: z.string(), fecha: z.string() }))
    .query(async ({ ctx, input }) => {
      const date = new Date(input.fecha)
      const diaSemana = date.getDay()

      const avail = await ctx.db.doctorAvailability.findUnique({
        where: {
          workspaceId_diaSemana: {
            workspaceId: input.workspaceId,
            diaSemana,
          },
        },
      })
      if (!avail || !avail.activo) return []

      const [startH, startM] = avail.horaInicio.split(":").map(Number)
      const [endH, endM] = avail.horaFin.split(":").map(Number)
      const slots: string[] = []
      let cursor = startH * 60 + startM
      const end = endH * 60 + endM
      while (cursor + avail.duracionMinutos <= end) {
        const h = Math.floor(cursor / 60).toString().padStart(2, "0")
        const m = (cursor % 60).toString().padStart(2, "0")
        slots.push(`${h}:${m}`)
        cursor += avail.duracionMinutos
      }

      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const existing = await ctx.db.appointment.findMany({
        where: {
          workspaceId: input.workspaceId,
          fechaHora: { gte: dayStart, lte: dayEnd },
          status: { in: ["REQUESTED", "SCHEDULED", "CONFIRMED"] },
        },
        select: { fechaHora: true },
      })

      const taken = new Set(
        existing.map((a) => {
          const d = new Date(a.fechaHora)
          return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
        }),
      )

      // Exclude slots when there's an exception for this date
      const exception = await ctx.db.availabilityException.findFirst({
        where: { workspaceId: input.workspaceId, fecha: { gte: dayStart, lte: dayEnd } },
      })
      if (exception) return []

      return slots.filter((s) => !taken.has(s))
    }),

  listExceptions: doctorProcedure
    .input(z.object({ desde: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const desde = input.desde ? new Date(input.desde) : new Date()
      desde.setHours(0, 0, 0, 0)
      return ctx.db.availabilityException.findMany({
        where: { workspaceId: ctx.session.workspaceId, fecha: { gte: desde } },
        orderBy: { fecha: "asc" },
        take: 60,
      })
    }),

  addException: doctorProcedure
    .input(z.object({ fecha: z.string(), motivo: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.fecha)
      date.setHours(12, 0, 0, 0) // Noon to avoid timezone edge cases
      return ctx.db.availabilityException.create({
        data: { workspaceId: ctx.session.workspaceId, fecha: date, motivo: input.motivo },
      })
    }),

  deleteException: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const exc = await ctx.db.availabilityException.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!exc) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.availabilityException.delete({ where: { id: input.id } })
    }),
})

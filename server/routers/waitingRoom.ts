import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure } from "../trpc"

// Audit S7 (2026-07-06): today/checkin/done/remove migrated from
// protectedProcedure to doctorProcedure. Waiting room operations are
// performed by DOCTOR (calling patient) or by SECRETARY/ASSISTANT at
// reception (checkin, done, remove). Since staff doesn't have login yet
// (Gap #5 in PERMISSIONS.md), only DOCTOR can drive these mutations.
// When staff login is added, a staffProcedure will allow SECRETARY and
// NURSE to operate here.
export const waitingRoomRouter = router({
  today: doctorProcedure.query(async ({ ctx }) => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    return ctx.db.waitingEntry.findMany({
      where: {
        workspaceId: ctx.session.workspaceId,
        llegadaAt: { gte: start, lte: end },
        estado: { not: "RETIRADO" },
      },
      include: {
        patientRegistration: {
          include: { patient: { select: { nombre: true, apellido: true, telefono: true } } },
        },
        appointment: { select: { fechaHora: true, tipo: true } },
      },
      orderBy: { turno: "asc" },
    })
  }),

  checkin: doctorProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        appointmentId: z.string().optional(),
        notas: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })

      // prevent duplicate same-day entry
      const start = new Date(); start.setHours(0, 0, 0, 0)
      const end = new Date(); end.setHours(23, 59, 59, 999)
      const existing = await ctx.db.waitingEntry.findFirst({
        where: {
          workspaceId: ctx.session.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
          llegadaAt: { gte: start, lte: end },
          estado: { not: "RETIRADO" },
        },
      })
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "El paciente ya está en sala de espera" })

      // get next turno
      const last = await ctx.db.waitingEntry.findFirst({
        where: { workspaceId: ctx.session.workspaceId, llegadaAt: { gte: start, lte: end } },
        orderBy: { turno: "desc" },
      })
      const turno = (last?.turno ?? 0) + 1

      return ctx.db.waitingEntry.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
          appointmentId: input.appointmentId ?? null,
          turno,
          notas: input.notas,
        },
      })
    }),

  callPatient: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.waitingEntry.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" })

      const ws = await ctx.db.workspace.findUnique({
        where: { id: ctx.session.workspaceId },
        select: { autoCreateHistoryOnEncounter: true },
      })

      if (ws?.autoCreateHistoryOnEncounter) {
        const existingDraft = await ctx.db.encounter.findFirst({
          where: {
            workspaceId: ctx.session.workspaceId,
            patientRegistrationId: entry.patientRegistrationId,
            status: "DRAFT",
          },
        })

        if (!existingDraft) {
          await ctx.db.encounter.create({
            data: {
              workspaceId: ctx.session.workspaceId,
              patientRegistrationId: entry.patientRegistrationId,
              doctorId: ctx.session.doctorId,
              appointmentId: entry.appointmentId ?? undefined,
              status: "DRAFT",
            },
          })
        }
      }

      return ctx.db.waitingEntry.update({
        where: { id: input.id },
        data: { estado: "ATENDIENDO", llamadoAt: new Date() },
      })
    }),

  done: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.waitingEntry.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.waitingEntry.update({
        where: { id: input.id },
        data: { estado: "LISTO" },
      })
    }),

  remove: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.waitingEntry.updateMany({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
        data: { estado: "RETIRADO" },
      })
      return { success: true }
    }),
})

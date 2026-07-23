import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { randomUUID } from "node:crypto"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { router, doctorProcedure, protectedProcedure, portalProcedure } from "../trpc"
import { notifyAppointmentCreated, notifyAppointmentConfirmed } from "../../lib/whatsapp"
import { sendAppointmentCreated, sendAppointmentConfirmed } from "../../lib/email"
import { decryptField } from "@/lib/field-crypto"
import { formatDoctorName } from "@/lib/doctor-utils"

export const appointmentRouter = router({
  create: doctorProcedure
    .input(
      z.object({
        patientRegistrationId: z.string().optional(),
        titulo: z.string().optional(),
        tipo: z.enum(["CONSULTA", "SEGUIMIENTO", "EMERGENCIA", "PROCEDIMIENTO", "VIDEOCONSULTA"]).default("CONSULTA"),
        fechaHora: z.string(),
        duracionMinutos: z.number().int().min(5).max(480).default(30),
        notas: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const appt = await ctx.db.$transaction(async (tx) => {
        if (input.patientRegistrationId) {
          const reg = await tx.patientRegistration.findFirst({
            where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
          })
          if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
        }

        const existing = await tx.appointment.findFirst({
          where: {
            workspaceId: ctx.session.workspaceId,
            fechaHora: new Date(input.fechaHora),
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
          },
        })
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe una cita programada para esta fecha y hora exactas.",
          })
        }

        return tx.appointment.create({
          data: {
            workspaceId: ctx.session.workspaceId,
            patientRegistrationId: input.patientRegistrationId,
            titulo: input.titulo,
            tipo: input.tipo,
            fechaHora: new Date(input.fechaHora),
            duracionMinutos: input.duracionMinutos,
            notas: input.notas,
          },
          include: {
            patientRegistration: { include: { patient: true } },
            workspace: { include: { doctor: true } },
          },
        })
      })

      const pat = appt.patientRegistration?.patient
      if (pat) {
        const fechaHoraStr = format(new Date(input.fechaHora), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
        const doctorName = formatDoctorName(appt.workspace.doctor)
        const email = pat.email || (pat.emailCifrado ? decryptField(pat.emailCifrado) : null)
        const nombre = pat.nombre || (pat.nombreCifrado ? decryptField(pat.nombreCifrado) : "") || ""
        const apellido = pat.apellido || (pat.apellidoCifrado ? decryptField(pat.apellidoCifrado) : "") || ""
        
        if (pat.telefono) {
          // WhatsApp temporalmente desactivado
          // void notifyAppointmentCreated({
          //   phone: pat.telefono,
          //   patientName: `${nombre} ${apellido}`.trim(),
          //   doctorName,
          //   fechaHora: fechaHoraStr,
          // })
        }
        if (email) {
          const { sendAppointmentCreated } = await import("../../lib/email")
          void sendAppointmentCreated({
            to: email,
            patientName: `${nombre} ${apellido}`.trim(),
            fechaHora: fechaHoraStr,
            doctorName,
          })
        }
      }

      return appt
    }),

  update: doctorProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "NO_SHOW", "COMPLETED"]).optional(),
        fechaHora: z.string().optional(),
        duracionMinutos: z.number().int().min(5).max(480).optional(),
        notas: z.string().optional(),
        titulo: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const appt = await ctx.db.appointment.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" })
      const { id, fechaHora, ...rest } = input
      const updated = await ctx.db.appointment.update({
        where: { id },
        data: {
          ...rest,
          ...(fechaHora ? { fechaHora: new Date(fechaHora) } : {}),
        },
        include: { patientRegistration: { include: { patient: true } } },
      })

      if (input.status === "CONFIRMED") {
        const pat = updated.patientRegistration?.patient
        if (pat) {
          const dt = updated.fechaHora
          const fechaHoraStr = format(dt, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
          const ws = await ctx.db.workspace.findUnique({
            where: { id: ctx.session.workspaceId },
            include: { doctor: true },
          })
          const doctorName = ws ? formatDoctorName(ws.doctor) : ""
          
          const email = pat.email || (pat.emailCifrado ? decryptField(pat.emailCifrado) : null)
          const nombre = pat.nombre || (pat.nombreCifrado ? decryptField(pat.nombreCifrado) : "") || ""
          const apellido = pat.apellido || (pat.apellidoCifrado ? decryptField(pat.apellidoCifrado) : "") || ""

          if (pat.telefono) {
            // WhatsApp temporalmente desactivado
            // void notifyAppointmentConfirmed({
            //   phone: pat.telefono,
            //   patientName: `${nombre} ${apellido}`.trim(),
            //   fechaHora: fechaHoraStr,
            // })
          }
          if (email) {
            void sendAppointmentConfirmed({
              to: email,
              patientName: `${nombre} ${apellido}`.trim(),
              fechaHora: fechaHoraStr,
              doctorName,
            })
          }
        }
      }

      return updated
    }),

  delete: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const appt = await ctx.db.appointment.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.appointment.delete({ where: { id: input.id } })
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.appointment.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
        include: {
          patientRegistration: { include: { patient: { select: { nombre: true, apellido: true } } } },
        },
      })
    }),

  list: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.appointment.findMany({
        where: {
          workspaceId: ctx.session.workspaceId,
          fechaHora: {
            gte: new Date(input.from),
            lte: new Date(input.to),
          },
        },
        include: { patientRegistration: { include: { patient: true } } },
        orderBy: { fechaHora: "asc" },
      })
    }),

  listUpcoming: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.appointment.findMany({
      where: {
        workspaceId: ctx.session.workspaceId,
        fechaHora: { gte: new Date() },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      include: { patientRegistration: { include: { patient: true } } },
      orderBy: { fechaHora: "asc" },
      take: 20,
    })
  }),

  markArrival: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["CONFIRMED", "NO_SHOW", "COMPLETED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const appt = await ctx.db.appointment.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.appointment.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    }),

  requestFromPortal: portalProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        fecha: z.string(),
        hora: z.string().regex(/^\d{2}:\d{2}$/),
        notas: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let reg = await ctx.db.patientRegistration.findFirst({
        where: { patientId: ctx.patientId, workspaceId: input.workspaceId },
      })
      
      // If no local registration found, check if it's a PortalUser booking
      if (!reg) {
        const portalUser = await ctx.db.portalUser.findUnique({
          where: { id: ctx.patientId },
          include: { patientProfile: true }
        })

        if (portalUser && portalUser.patientProfile) {
          // Auto-create local Patient and PatientRegistration
          const profile = portalUser.patientProfile
          const localPatient = await ctx.db.patient.create({
            data: {
              workspaceId: input.workspaceId,
              nombre: profile.nombre,
              apellido: profile.apellido,
              tipoIdentificacion: profile.tipoIdentificacion,
              numeroIdentificacion: profile.numeroIdentificacion, // Should be encrypted in a real setup if required
              email: portalUser.email,
              telefono: portalUser.telefono,
              sexo: profile.sexo || "MASCULINO",
              fechaNacimiento: profile.fechaNacimiento || new Date("2000-01-01"),
              registrations: {
                create: {
                  workspaceId: input.workspaceId,
                  idDisplay: `PAT-${Math.floor(1000 + Math.random() * 9000)}`
                }
              }
            },
            include: { registrations: true }
          })
          
          reg = localPatient.registrations[0]
        }
      }

      if (!reg) throw new TRPCError({ code: "FORBIDDEN", message: "Patient registration required." })

      const [h, m] = input.hora.split(":").map(Number)
      // Build the timestamp in America/Caracas explicitly. Previously this
      // used Date#setHours(h, m) which runs in the *server's* local time
      // — if the server is UTC (e.g. Coolify container) the appointment
      // was scheduled 4-5 hours earlier than the patient requested.
      // We construct an ISO string with a fixed -04:00 offset (Venezuela
      // is UTC-4 year-round, no DST).
      const fechaHora = new Date(`${input.fecha}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-04:00`)

      const conflict = await ctx.db.appointment.findFirst({
        where: {
          workspaceId: input.workspaceId,
          fechaHora,
          status: { in: ["REQUESTED", "SCHEDULED", "CONFIRMED"] },
        },
      })
      if (conflict)
        throw new TRPCError({ code: "CONFLICT", message: "Ese horario ya fue tomado." })

      const appt = await ctx.db.appointment.create({
        data: {
          workspaceId: input.workspaceId,
          patientRegistrationId: reg.id,
          tipo: "CONSULTA",
          status: "REQUESTED",
          fechaHora,
          duracionMinutos: 30,
          notas: input.notas,
        },
        include: { patientRegistration: { include: { patient: true } } },
      })

      const pat = appt.patientRegistration?.patient
      void ctx.db.notification.create({
        data: {
          workspaceId: input.workspaceId,
          tipo: "APPOINTMENT_REQUEST",
          titulo: "Nueva solicitud de cita",
          mensaje: `${pat?.nombre ?? "Un paciente"} ${pat?.apellido ?? ""} solicitó una cita para el ${fechaHora.toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}.`,
          referenciaId: appt.id,
        },
      })

      return appt
    }),

  createSeries: doctorProcedure
    .input(
      z.object({
        patientRegistrationId: z.string().optional(),
        titulo: z.string().optional(),
        tipo: z.enum(["CONSULTA", "SEGUIMIENTO", "EMERGENCIA", "PROCEDIMIENTO", "VIDEOCONSULTA"]).default("CONSULTA"),
        fechaHoraInicial: z.string(),
        duracionMinutos: z.number().int().min(5).max(480).default(30),
        notas: z.string().optional(),
        intervalo: z.enum(["SEMANAL", "QUINCENAL", "MENSUAL"]),
        cantidad: z.number().int().min(2).max(12),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.patientRegistrationId) {
        const reg = await ctx.db.patientRegistration.findFirst({
          where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        })
        if (!reg) throw new TRPCError({ code: "NOT_FOUND" })
      }
      const serieId = `serie_${randomUUID()}`
      const base = new Date(input.fechaHoraInicial)
      const appts = []
      for (let i = 0; i < input.cantidad; i++) {
        const fechaHora = new Date(base)
        if (input.intervalo === "SEMANAL") fechaHora.setDate(base.getDate() + i * 7)
        else if (input.intervalo === "QUINCENAL") fechaHora.setDate(base.getDate() + i * 14)
        else fechaHora.setMonth(base.getMonth() + i)
        appts.push({
          workspaceId: ctx.session.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
          titulo: input.titulo,
          tipo: input.tipo,
          fechaHora,
          duracionMinutos: input.duracionMinutos,
          notas: input.notas,
          serieId,
        })
      }
      await ctx.db.appointment.createMany({ data: appts })
      return { count: appts.length, serieId }
    }),

  listByPatient: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        select: { id: true },
      })
      if (!reg) return []
      return ctx.db.appointment.findMany({
        where: { patientRegistrationId: input.patientRegistrationId },
        orderBy: { fechaHora: "desc" },
        select: {
          id: true,
          tipo: true,
          status: true,
          fechaHora: true,
          duracionMinutos: true,
          titulo: true,
          notas: true,
        },
        take: 50,
      })
    }),

  sendReminder: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const appt = await ctx.db.appointment.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
        include: {
          patientRegistration: { include: { patient: true } },
          workspace: { include: { doctor: true } },
        },
      })
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" })
      if (!["SCHEDULED", "CONFIRMED"].includes(appt.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Solo se puede recordar citas confirmadas o programadas." })
      }

      const pat = appt.patientRegistration?.patient
      if (!pat?.telefono) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El paciente no tiene teléfono registrado." })
      }

      const { notifyAppointmentReminder } = await import("../../lib/whatsapp")
      const fechaHoraStr = format(appt.fechaHora, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
      const doctorName = formatDoctorName(appt.workspace.doctor)

      // WhatsApp temporalmente desactivado
      // const result = await notifyAppointmentReminder({
      //   phone: pat.telefono,
      //   patientName: `${pat.nombre} ${pat.apellido}`,
      //   doctorName,
      //   fechaHora: fechaHoraStr,
      // })

      // return { sent: result.success, phone: pat.telefono, error: result.error }
      return { sent: false, phone: pat.telefono, error: "WhatsApp desactivado por ahora" }
    }),
})

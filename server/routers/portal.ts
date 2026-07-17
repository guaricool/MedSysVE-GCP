import { z } from "zod"
import { TRPCError } from "@trpc/server"
import bcrypt from "bcryptjs"
import { router, portalProcedure } from "../trpc"
import { portalPasswordSchema, BCRYPT_COST } from "@/lib/password-policy"
import { safeLog } from "@/lib/log-sanitizer"
import { readPatientCedula } from "@/lib/patient-crypto"

export const portalRouter = router({
  myAppointments: portalProcedure.query(async ({ ctx }) => {
    const regs = await ctx.db.patientRegistration.findMany({
      where: { patientId: ctx.patientId },
      select: { id: true },
    })
    const regIds = regs.map((r) => r.id)
    return ctx.db.appointment.findMany({
      where: { patientRegistrationId: { in: regIds } },
      orderBy: { fechaHora: "desc" },
      select: {
        id: true,
        tipo: true,
        status: true,
        fechaHora: true,
        duracionMinutos: true,
        notas: true,
        titulo: true,
        workspaceId: true,
      },
      take: 50,
    })
  }),

  myDocuments: portalProcedure.query(async ({ ctx }) => {
    const regs = await ctx.db.patientRegistration.findMany({
      where: { patientId: ctx.patientId },
      select: { id: true },
    })
    const regIds = regs.map((r) => r.id)
    return ctx.db.document.findMany({
      where: { patientRegistrationId: { in: regIds }, visibleEnPortal: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, tipo: true, createdAt: true, pdfUrl: true, encounterId: true, patientRegistration: { select: { workspaceId: true } } },
    })
  }),

  myEncounters: portalProcedure.query(async ({ ctx }) => {
    const regs = await ctx.db.patientRegistration.findMany({
      where: { patientId: ctx.patientId },
      include: {
        workspace: {
          select: {
            nombre: true,
            doctor: { select: { nombre: true, apellido: true } },
          },
        },
      },
    })
    const regIds = regs.map((r) => r.id)
    const regMap = Object.fromEntries(regs.map((r) => [r.id, r]))
    
    const encounters = await ctx.db.encounter.findMany({
      where: { patientRegistrationId: { in: regIds }, status: { in: ["SIGNED", "AMENDED"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, patientRegistrationId: true },
      take: 50,
    })
    
    return encounters.map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      workspaceId: regMap[e.patientRegistrationId]?.workspaceId ?? "",
      workspaceNombre: regMap[e.patientRegistrationId]?.workspace.nombre ?? "",
      doctorNombre: (() => {
        const doc = regMap[e.patientRegistrationId]?.workspace.doctor
        return doc ? `Dr. ${doc.nombre} ${doc.apellido}` : ""
      })(),
    }))
  }),

  getDocument: portalProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findUnique({
        where: { id: input.id },
        include: { patientRegistration: true },
      })
      if (!doc || doc.patientRegistration.patientId !== ctx.patientId || !doc.visibleEnPortal) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }
      return doc
    }),

  myWorkspaces: portalProcedure.query(async ({ ctx }) => {
    const regs = await ctx.db.patientRegistration.findMany({
      where: { patientId: ctx.patientId },
      include: {
        workspace: {
          include: { doctor: { select: { nombre: true, apellido: true, especialidadPrincipal: true } } },
        },
      },
    })
    return regs.map((r) => ({
      workspaceId: r.workspaceId,
      workspaceNombre: r.workspace.nombre,
      doctor: r.workspace.doctor,
    }))
  }),

  myLabResults: portalProcedure.query(async ({ ctx }) => {
    const regs = await ctx.db.patientRegistration.findMany({
      where: { patientId: ctx.patientId },
      select: { id: true },
    })
    const regIds = regs.map((r) => r.id)
    return ctx.db.labResult.findMany({
      where: { patientRegistrationId: { in: regIds } },
      orderBy: { fecha: "desc" },
      select: { id: true, titulo: true, fecha: true, resultado: true, patientRegistration: { select: { workspaceId: true } } },
      take: 50,
    })
  }),

  cancelAppointment: portalProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const regs = await ctx.db.patientRegistration.findMany({
        where: { patientId: ctx.patientId },
        select: { id: true },
      })
      const regIds = new Set(regs.map((r) => r.id))
      const appt = await ctx.db.appointment.findUnique({
        where: { id: input.id },
        select: { id: true, status: true, patientRegistrationId: true },
      })
      if (!appt || !regIds.has(appt.patientRegistrationId ?? "")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }
      if (appt.status === "COMPLETED" || appt.status === "NO_SHOW" || appt.status === "CANCELLED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No se puede cancelar esta cita." })
      }
      return ctx.db.appointment.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      })
    }),

  getAnnouncements: portalProcedure.query(async ({ ctx }) => {
    const regs = await ctx.db.patientRegistration.findMany({
      where: { patientId: ctx.patientId },
      select: { workspaceId: true, workspace: { select: { nombre: true } } },
    })
    const workspaceIds = regs.map((r) => r.workspaceId)
    const wsMap = Object.fromEntries(regs.map((r) => [r.workspaceId, r.workspace.nombre]))
    const announcements = await ctx.db.announcement.findMany({
      where: { workspaceId: { in: workspaceIds }, activo: true },
      orderBy: { creadoAt: "desc" },
      take: 20,
    })
    return announcements.map((a) => ({ ...a, workspaceNombre: wsMap[a.workspaceId] ?? "" }))
  }),

  getProfile: portalProcedure.query(async ({ ctx }) => {
    const pat = await ctx.db.patient.findUnique({
      where: { id: ctx.patientId },
      select: { nombre: true, apellido: true, telefono: true, email: true, numeroIdentificacion: true, sinCedula: true, tipoIdentificacion: true },
    })
    if (!pat) throw new TRPCError({ code: "NOT_FOUND" })
    return { ...pat, numeroIdentificacion: readPatientCedula(pat) ?? null }
  }),

  updateProfile: portalProcedure
    .input(
      z.object({
        telefono: z.string().optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.patient.update({
        where: { id: ctx.patientId },
        data: {
          telefono: input.telefono,
          email: input.email,
        },
        select: { nombre: true, apellido: true, telefono: true, email: true },
      })
    }),

  changePassword: portalProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1).max(128),
        // Strong patient password policy (min 10 chars, mixed case, digit).
        newPassword: portalPasswordSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pat = await ctx.db.patient.findUnique({
        where: { id: ctx.patientId },
        select: { portalPasswordHash: true },
      })
      if (!pat?.portalPasswordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "Sin contraseña de portal configurada." })
      const valid = await bcrypt.compare(input.currentPassword, pat.portalPasswordHash)
      if (!valid) {
        safeLog("warn", "portal.change_password_wrong_current", {
          patientId: ctx.patientId.slice(0, 6) + "***",
        })
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña actual incorrecta." })
      }
      // Disallow reusing the same password (compare new against current).
      const sameAsOld = await bcrypt.compare(input.newPassword, pat.portalPasswordHash)
      if (sameAsOld) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La nueva contraseña debe ser distinta a la actual.",
        })
      }
      const hash = await bcrypt.hash(input.newPassword, BCRYPT_COST)
      await ctx.db.patient.update({ where: { id: ctx.patientId }, data: { portalPasswordHash: hash } })
      safeLog("info", "portal.password_changed", {
        patientId: ctx.patientId.slice(0, 6) + "***",
      })
      return { ok: true }
    }),

  rescheduleAppointment: portalProcedure
    .input(z.object({ appointmentId: z.string(), newFechaHora: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const regs = await ctx.db.patientRegistration.findMany({
        where: { patientId: ctx.patientId },
        select: { id: true },
      })
      const regIds = new Set(regs.map((r) => r.id))

      const appt = await ctx.db.appointment.findUnique({
        where: { id: input.appointmentId },
        select: {
          id: true, status: true, patientRegistrationId: true,
          workspaceId: true, tipo: true, duracionMinutos: true, titulo: true,
        },
      })
      if (!appt || !regIds.has(appt.patientRegistrationId ?? "")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }
      if (!["REQUESTED", "SCHEDULED"].includes(appt.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No se puede reprogramar esta cita." })
      }
      const newDate = new Date(input.newFechaHora)
      if (newDate <= new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La nueva fecha debe ser futura." })
      }

      await ctx.db.appointment.update({ where: { id: appt.id }, data: { status: "CANCELLED" } })

      return ctx.db.appointment.create({
        data: {
          workspaceId: appt.workspaceId,
          patientRegistrationId: appt.patientRegistrationId,
          tipo: appt.tipo,
          duracionMinutos: appt.duracionMinutos,
          titulo: appt.titulo ? `${appt.titulo} (reprogramada)` : undefined,
          status: "REQUESTED",
          fechaHora: newDate,
        },
      })
    }),

  myVaccines: portalProcedure.query(async ({ ctx }) => {
    const regs = await ctx.db.patientRegistration.findMany({
      where: { patientId: ctx.patientId },
      select: {
        id: true,
        workspaceId: true,
        workspace: { select: { nombre: true, doctor: { select: { nombre: true, apellido: true } } } },
      },
    })
    const regIds = regs.map((r) => r.id)
    const regMap = Object.fromEntries(regs.map((r) => [r.id, r]))
    const vaccines = await (ctx.db as any).vaccine.findMany({
      where: { patientRegistrationId: { in: regIds } },
      orderBy: { fechaAplicacion: "desc" },
      select: {
        id: true,
        vacuna: true,
        fechaAplicacion: true,
        dosis: true,
        lote: true,
        proximaDosis: true,
        notas: true,
        aplicadoPor: true,
        patientRegistrationId: true,
      },
    })
    return vaccines.map((v: any) => ({
      ...v,
      workspaceId: regMap[v.patientRegistrationId]?.workspaceId ?? "",
      workspaceNombre: regMap[v.patientRegistrationId]?.workspace.nombre ?? "",
      doctorNombre: (() => {
        const doc = regMap[v.patientRegistrationId]?.workspace.doctor
        return doc ? `Dr. ${doc.nombre} ${doc.apellido}` : ""
      })(),
    }))
  }),

  myLabOrders: portalProcedure.query(async ({ ctx }) => {
    const regs = await ctx.db.patientRegistration.findMany({
      where: { patientId: ctx.patientId },
      select: { id: true },
    })
    const regIds = regs.map((r) => r.id)
    return ctx.db.labOrder.findMany({
      where: { encounter: { patientRegistrationId: { in: regIds } } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        estudios: true,
        indicacionesClinicas: true,
        urgente: true,
        createdAt: true,
        encounterId: true,
        encounter: { select: { patientRegistration: { select: { workspaceId: true } } } },
      },
      take: 50,
    })
  }),

  myImagingOrders: portalProcedure.query(async ({ ctx }) => {
    const regs = await ctx.db.patientRegistration.findMany({
      where: { patientId: ctx.patientId },
      select: { id: true },
    })
    const regIds = regs.map((r) => r.id)
    return ctx.db.imagingOrder.findMany({
      where: { encounter: { patientRegistrationId: { in: regIds } } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tipoImagen: true,
        region: true,
        indicacionesClinicas: true,
        urgente: true,
        resultadoUrl: true,
        resultadoNotas: true,
        createdAt: true,
        encounterId: true,
        encounter: { select: { patientRegistration: { select: { workspaceId: true } } } },
      },
      take: 50,
    })
  }),

  myPrescriptions: portalProcedure.query(async ({ ctx }) => {
    const regs = await ctx.db.patientRegistration.findMany({
      where: { patientId: ctx.patientId },
      select: {
        id: true,
        workspaceId: true,
        workspace: {
          select: {
            nombre: true,
            doctor: { select: { nombre: true, apellido: true } },
          },
        },
      },
    })
    const regMap = Object.fromEntries(regs.map((r) => [r.id, r]))
    const regIds = regs.map((r) => r.id)
    const prescriptions = await ctx.db.prescription.findMany({
      where: { encounter: { patientRegistrationId: { in: regIds }, status: "SIGNED" } },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            medication: { select: { nombreGenerico: true, formaFarmaceutica: true } },
          },
        },
        encounter: { select: { patientRegistrationId: true, createdAt: true } },
      },
      take: 30,
    })
    return prescriptions.map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      pdfUrl: p.pdfUrl ?? null,
      encounterId: p.encounterId,
      workspaceId: regMap[p.encounter.patientRegistrationId]?.workspaceId ?? "",
      workspaceNombre: regMap[p.encounter.patientRegistrationId]?.workspace.nombre ?? "",
      doctorNombre: (() => {
        const doc = regMap[p.encounter.patientRegistrationId]?.workspace.doctor
        return doc ? `Dr. ${doc.nombre} ${doc.apellido}` : ""
      })(),
      items: p.items.map((it) => ({
        nombreGenerico: it.medication.nombreGenerico,
        formaFarmaceutica: it.medication.formaFarmaceutica,
        concentracion: it.concentracion,
        dosis: it.dosis,
        frecuencia: it.frecuencia,
        duracion: it.duracion,
      })),
    }))
  }),
})

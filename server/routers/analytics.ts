import { z } from "zod"
import { getISOWeek, getYear, differenceInYears } from "date-fns"
import { router, doctorProcedure } from "../trpc"

export const analyticsRouter = router({
  // All procedures are doctorProcedure as of 2026-07-06 (audit S5 partial).
  // Per PERMISSIONS.md Gap #5, staff doesn't have login yet, so only DOCTOR
  // should access clinical/operational analytics.
  summary: doctorProcedure.query(async ({ ctx }) => {
    const { workspaceId } = ctx.session
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalPatients, citasThisMonth, invoicesThisMonth, topDiagnoses] = await Promise.all([
      ctx.db.patientRegistration.count({ where: { workspaceId } }),
      ctx.db.appointment.count({
        where: { workspaceId, fechaHora: { gte: startOfMonth } },
      }),
      ctx.db.invoice.findMany({
        where: { workspaceId, createdAt: { gte: startOfMonth } },
        select: { montoUsd: true, status: true },
      }),
      ctx.db.diagnosis.groupBy({
        by: ["descripcion", "codigoCie10"],
        _count: { id: true },
        where: { encounter: { workspaceId } },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ])

    const paid = invoicesThisMonth.filter((i) => i.status === "PAID")
    const pending = invoicesThisMonth.filter((i) => i.status === "PENDING")
    const ingresosUsd = paid.reduce((s, i) => s + Number(i.montoUsd), 0)
    const pendienteUsd = pending.reduce((s, i) => s + Number(i.montoUsd), 0)

    return {
      totalPatients,
      citasThisMonth,
      ingresosUsd,
      pendienteUsd,
      topDiagnoses: topDiagnoses.map((d) => ({
        codigo: d.codigoCie10,
        descripcion: d.descripcion,
        count: d._count.id,
      })),
    }
  }),

  citasPorSemana: doctorProcedure.query(async ({ ctx }) => {
    const { workspaceId } = ctx.session
    const since = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)

    const appts = await ctx.db.appointment.findMany({
      where: { workspaceId, fechaHora: { gte: since } },
      select: { fechaHora: true },
    })

    const map = new Map<string, number>()
    for (const a of appts) {
      const week = getISOWeek(a.fechaHora)
      const year = getYear(a.fechaHora)
      const key = `${year}-S${String(week).padStart(2, "0")}`
      map.set(key, (map.get(key) ?? 0) + 1)
    }

    const result: { semana: string; citas: number }[] = []
    const cursor = new Date(since)
    cursor.setDate(cursor.getDate() - cursor.getDay() + 1) // Monday of oldest week
    for (let i = 0; i < 8; i++) {
      const week = getISOWeek(cursor)
      const year = getYear(cursor)
      const key = `${year}-S${String(week).padStart(2, "0")}`
      result.push({ semana: key, citas: map.get(key) ?? 0 })
      cursor.setDate(cursor.getDate() + 7)
    }
    return result
  }),

  ingresosPorMes: doctorProcedure.query(async ({ ctx }) => {
    const { workspaceId } = ctx.session
    const now = new Date()
    const since = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const invoices = await ctx.db.invoice.findMany({
      where: { workspaceId, status: "PAID", fechaPago: { gte: since } },
      select: { montoUsd: true, fechaPago: true },
    })

    const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const map = new Map<string, number>()
    for (const inv of invoices) {
      if (!inv.fechaPago) continue
      const m = inv.fechaPago.getMonth()
      const y = inv.fechaPago.getFullYear()
      const key = `${MES[m]} ${y}`
      map.set(key, (map.get(key) ?? 0) + Number(inv.montoUsd))
    }

    const result: { mes: string; ingresos: number }[] = []
    const c = new Date(since)
    for (let i = 0; i < 6; i++) {
      const key = `${MES[c.getMonth()]} ${c.getFullYear()}`
      result.push({ mes: key, ingresos: Number((map.get(key) ?? 0).toFixed(2)) })
      c.setMonth(c.getMonth() + 1)
    }
    return result
  }),

  demographics: doctorProcedure.query(async ({ ctx }) => {
    const { workspaceId } = ctx.session
    const now = new Date()

    const regs = await ctx.db.patientRegistration.findMany({
      where: { workspaceId },
      select: { createdAt: true, patient: { select: { fechaNacimiento: true, sexo: true } } },
    })

    const ageMap: Record<string, number> = { "0-14": 0, "15-29": 0, "30-44": 0, "45-59": 0, "60+": 0 }
    const genderMap: Record<string, number> = { MASCULINO: 0, FEMENINO: 0, OTRO: 0 }

    for (const reg of regs) {
      const age = differenceInYears(now, new Date(reg.patient.fechaNacimiento))
      if (age <= 14) ageMap["0-14"]++
      else if (age <= 29) ageMap["15-29"]++
      else if (age <= 44) ageMap["30-44"]++
      else if (age <= 59) ageMap["45-59"]++
      else ageMap["60+"]++
      const g = reg.patient.sexo as string
      genderMap[g] = (genderMap[g] ?? 0) + 1
    }

    const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const since6 = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const monthMap = new Map<string, number>()
    for (const reg of regs) {
      if (reg.createdAt >= since6) {
        const key = `${MES[reg.createdAt.getMonth()]} ${reg.createdAt.getFullYear()}`
        monthMap.set(key, (monthMap.get(key) ?? 0) + 1)
      }
    }

    const newPatientsPerMonth: { mes: string; nuevos: number }[] = []
    const c = new Date(since6)
    for (let i = 0; i < 6; i++) {
      const key = `${MES[c.getMonth()]} ${c.getFullYear()}`
      newPatientsPerMonth.push({ mes: key, nuevos: monthMap.get(key) ?? 0 })
      c.setMonth(c.getMonth() + 1)
    }

    return {
      ageGroups: Object.entries(ageMap).map(([rango, count]) => ({ rango, count })),
      genderCounts: Object.entries(genderMap).map(([sexo, count]) => ({ sexo, count })),
      newPatientsPerMonth,
    }
  }),

  topDiagnoses: doctorProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.diagnosis.groupBy({
      by: ["codigoCie10", "descripcion"],
      where: { encounter: { workspaceId: ctx.session.workspaceId } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    })
    return rows.map((r) => ({
      codigo: r.codigoCie10,
      descripcion: r.descripcion,
      count: r._count.id,
    }))
  }),

  retention: doctorProcedure.query(async ({ ctx }) => {
    const since = new Date()
    since.setDate(since.getDate() - 90)

    const totalRegs = await ctx.db.patientRegistration.count({
      where: { workspaceId: ctx.session.workspaceId },
    })

    const returning = await ctx.db.patientRegistration.count({
      where: {
        workspaceId: ctx.session.workspaceId,
        encounters: {
          some: { createdAt: { gte: since }, status: "SIGNED" },
        },
      },
    })

    return {
      totalPatients: totalRegs,
      activePatients: returning,
      retentionPct: totalRegs > 0 ? Math.round((returning / totalRegs) * 100) : 0,
    }
  }),

  chronics: doctorProcedure.query(async ({ ctx }) => {
    const { workspaceId } = ctx.session
    const CHRONIC_TAGS = [
      "HTA", "DM2", "Diabetes", "Hipertensión", "Asma", "EPOC",
      "IRC", "Hipotiroidismo", "Hipertiroidismo", "Cardiopatía",
      "Epilepsia", "Artritis", "Lupus", "Oncológico",
    ]
    const now = new Date()

    // Distinct patients with at least one chronic tag
    const taggedRegs = await ctx.db.patientTag.findMany({
      where: { workspaceId, etiqueta: { in: CHRONIC_TAGS } },
      distinct: ["patientRegistrationId"],
      select: { patientRegistrationId: true },
    })
    const regIds = taggedRegs.map((t) => t.patientRegistrationId)

    if (regIds.length === 0) return []

    const regs = await ctx.db.patientRegistration.findMany({
      where: { id: { in: regIds }, workspaceId },
      include: {
        patient: { select: { nombre: true, apellido: true, fechaNacimiento: true } },
        tags: { where: { workspaceId }, select: { etiqueta: true, color: true } },
        encounters: {
          where: { status: { in: ["SIGNED", "AMENDED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, vitales: true },
        },
        appointments: {
          where: { fechaHora: { gte: now }, status: { in: ["SCHEDULED", "CONFIRMED"] } },
          orderBy: { fechaHora: "asc" },
          take: 1,
          select: { fechaHora: true },
        },
      },
    })

    return regs.map((reg) => {
      const lastEnc = reg.encounters[0] ?? null
      const nextAppt = reg.appointments[0] ?? null
      const daysSince = lastEnc
        ? Math.floor((now.getTime() - new Date(lastEnc.createdAt).getTime()) / 86400000)
        : null
      const vitales = (lastEnc?.vitales ?? null) as Record<string, number | null> | null

      // Risk flags
      const noRecentVisit = daysSince === null || daysSince > 90
      const bpHigh =
        vitales?.taSistolica !== null && vitales?.taSistolica !== undefined && vitales.taSistolica > 140
      const noNextAppt = !nextAppt

      const riskScore = (noRecentVisit ? 2 : 0) + (bpHigh ? 1 : 0) + (noNextAppt ? 1 : 0)

      return {
        patientRegistrationId: reg.id,
        nombre: `${reg.patient.nombre} ${reg.patient.apellido}`,
        tags: reg.tags.map((t) => ({ etiqueta: t.etiqueta, color: t.color })),
        daysSinceLastVisit: daysSince,
        lastVisitAt: lastEnc?.createdAt ?? null,
        nextAppointmentAt: nextAppt?.fechaHora ?? null,
        vitales: vitales
          ? {
              tas: vitales.taSistolica ?? null,
              tad: vitales.taDiastolica ?? null,
              peso: vitales.peso ?? null,
              spo2: vitales.spo2 ?? null,
            }
          : null,
        riskScore,
        atRisk: riskScore >= 2,
      }
    }).sort((a, b) => b.riskScore - a.riskScore)
  }),

  alerts: doctorProcedure.query(async ({ ctx }) => {
    const { workspaceId } = ctx.session
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [requestedAppointments, overdueInvoices, unreadMessages] = await Promise.all([
      ctx.db.appointment.count({
        where: { workspaceId, status: "REQUESTED" },
      }),
      ctx.db.invoice.count({
        where: { workspaceId, status: "PENDING", createdAt: { lte: thirtyDaysAgo } },
      }),
      ctx.db.mensaje.count({
        where: { workspaceId, autor: "PATIENT", leido: false },
      }),
    ])

    return { requestedAppointments, overdueInvoices, unreadMessages }
  }),

  patientVitals: doctorProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!patient) return []
      const encounters = await ctx.db.encounter.findMany({
        where: {
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          vitales: { not: undefined },
        },
        select: { createdAt: true, vitales: true },
        orderBy: { createdAt: "asc" },
      })
      return encounters
        .filter((e) => e.vitales != null)
        .map((e) => {
          const v = e.vitales as Record<string, number | null>
          return {
            fecha: e.createdAt,
            peso: v.peso ?? null,
            talla: v.talla ?? null,
            // Full vitals surface so the historical chart on the patient
            // history page can render PA / FC / SpO2 / temperature as well,
            // not just growth percentiles.
            pas: v.taSistolica ?? null,
            pad: v.taDiastolica ?? null,
            fc: v.fc ?? null,
            spo2: v.spo2 ?? null,
            temperatura: v.temperatura ?? null,
          }
        })
    }),

  qualityIndicators: doctorProcedure.query(async ({ ctx }) => {
    const { workspaceId } = ctx.session
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const [
      totalPatients,
      totalEncounters,
      signedEncounters,
      appointmentsLast30,
      completedAppointmentsLast30,
      noShowLast30,
      pendingInvoices,
      paidInvoices,
      chronicPatients,
      chronicWithRecentVisit,
      prescriptionsLast30,
      encountersWithVitals,
    ] = await Promise.all([
      ctx.db.patientRegistration.count({ where: { workspaceId } }),
      ctx.db.encounter.count({ where: { workspaceId, createdAt: { gte: thirtyDaysAgo } } }),
      ctx.db.encounter.count({ where: { workspaceId, status: "SIGNED", createdAt: { gte: thirtyDaysAgo } } }),
      ctx.db.appointment.count({ where: { workspaceId, createdAt: { gte: thirtyDaysAgo } } }),
      ctx.db.appointment.count({ where: { workspaceId, status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } } }),
      ctx.db.appointment.count({ where: { workspaceId, status: "NO_SHOW", createdAt: { gte: thirtyDaysAgo } } }),
      ctx.db.invoice.count({ where: { workspaceId, status: "PENDING" } }),
      ctx.db.invoice.count({ where: { workspaceId, status: "PAID", createdAt: { gte: thirtyDaysAgo } } }),
      ctx.db.patientRegistration.count({ where: { workspaceId, tags: { some: { etiqueta: { in: ["HTA", "DM2", "Diabetes", "Hipertensión", "Asma", "EPOC"] } } } } }),
      ctx.db.patientRegistration.count({ where: { workspaceId, tags: { some: { etiqueta: { in: ["HTA", "DM2", "Diabetes", "Hipertensión", "Asma", "EPOC"] } } }, encounters: { some: { createdAt: { gte: ninetyDaysAgo } } } } }),
      ctx.db.prescription.count({ where: { encounter: { workspaceId }, createdAt: { gte: thirtyDaysAgo } } }),
      ctx.db.encounter.count({ where: { workspaceId, createdAt: { gte: thirtyDaysAgo }, NOT: { vitales: undefined } } }),
    ])

    const signRate = totalEncounters > 0 ? Math.round((signedEncounters / totalEncounters) * 100) : 0
    const completionRate = appointmentsLast30 > 0 ? Math.round((completedAppointmentsLast30 / appointmentsLast30) * 100) : 0
    const noShowRate = appointmentsLast30 > 0 ? Math.round((noShowLast30 / appointmentsLast30) * 100) : 0
    const chronicFollowUp = chronicPatients > 0 ? Math.round((chronicWithRecentVisit / chronicPatients) * 100) : 0
    const vitalsRate = totalEncounters > 0 ? Math.round((encountersWithVitals / totalEncounters) * 100) : 0

    return {
      totalPatients,
      totalEncounters,
      signRate,
      completionRate,
      noShowRate,
      chronicPatients,
      chronicFollowUp,
      pendingInvoices,
      paidInvoices,
      prescriptionsLast30,
      vitalsRate,
    }
  }),
})

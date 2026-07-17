import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { db } from "@/lib/db"
import { safeLog } from "@/lib/log-sanitizer"
import { headers } from "next/headers"

const ADMIN_EMAIL = "cpierluissis@gmail.com"

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.email !== ADMIN_EMAIL) {
    throw new TRPCError({ code: "FORBIDDEN" })
  }
  return next({ ctx })
})

async function captureContext() {
  const hdrs = await headers()
  return {
    ip:
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      hdrs.get("x-real-ip") ??
      "unknown",
    userAgent: hdrs.get("user-agent") ?? null,
  }
}

function truncateIp(ip: string): string {
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 3).join(":") + ":0:0:0:0:0"
  }
  const parts = ip.split(".")
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`
  return ip
}

export const adminRouter = router({
  // ---------------------------------------------------------------------
  // Existing endpoints (kept verbatim).
  // ---------------------------------------------------------------------

  stats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalDoctors,
      premiumDoctors,
      totalClinics,
      totalWorkspaces,
      totalPatients,
      totalEncounters,
      totalPrescriptions,
      totalAppointments,
      newestDoctors,
    ] = await Promise.all([
      ctx.db.doctor.count(),
      ctx.db.doctor.count({ where: { plan: "premium" } }),
      ctx.db.clinic.count({ where: { activa: true } }),
      ctx.db.workspace.count(),
      ctx.db.patient.count(),
      ctx.db.encounter.count(),
      ctx.db.prescription.count(),
      ctx.db.appointment.count(),
      ctx.db.doctor.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, nombre: true, apellido: true, email: true, createdAt: true, plan: true },
      }),
    ])

    return {
      totalDoctors,
      premiumDoctors,
      freeDoctors: totalDoctors - premiumDoctors,
      totalClinics,
      totalWorkspaces,
      totalPatients,
      totalEncounters,
      totalPrescriptions,
      totalAppointments,
      newestDoctors,
    }
  }),

  listDoctors: adminProcedure
    .input(z.object({ search: z.string().optional(), plan: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const doctors = await ctx.db.doctor.findMany({
        where: {
          ...(input?.plan ? { plan: input.plan } : {}),
          ...(input?.search
            ? {
                OR: [
                  { nombre: { contains: input.search, mode: "insensitive" } },
                  { apellido: { contains: input.search, mode: "insensitive" } },
                  { email: { contains: input.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          especialidadPrincipal: true,
          plan: true,
          isAdmin: true,
          createdAt: true,
          currentLegalVersion: true,
          _count: {
            select: {
              workspaces: true,
              consentAcceptances: true,
            },
          },
          workspaces: {
            take: 1,
            select: {
              _count: {
                select: {
                  patientRegs: true,
                  encounters: true,
                },
              },
            },
          },
        },
      })
      return doctors.map((d) => ({
        id: d.id,
        nombre: d.nombre,
        apellido: d.apellido,
        email: d.email,
        especialidad: d.especialidadPrincipal,
        plan: d.plan,
        isAdmin: d.isAdmin,
        createdAt: d.createdAt,
        workspaces: d._count.workspaces,
        consentsGiven: d._count.consentAcceptances,
        pacientes: d.workspaces[0]?._count.patientRegs ?? 0,
        encuentros: d.workspaces[0]?._count.encounters ?? 0,
      }))
    }),

  setPlan: adminProcedure
    .input(z.object({ doctorId: z.string(), plan: z.enum(["free", "premium", "trial", "cortesia"]) }))
    .mutation(async ({ ctx, input }) => {
      const ip = (await captureContext()).ip
      const previous = await ctx.db.doctor.findUnique({
        where: { id: input.doctorId },
        select: { plan: true },
      })
      await ctx.db.doctor.update({
        where: { id: input.doctorId },
        data: { plan: input.plan },
      })
      safeLog("info", "admin.set_plan", {
        doctorId: input.doctorId,
        previousPlan: previous?.plan,
        newPlan: input.plan,
        actor: ADMIN_EMAIL,
        ip: truncateIp(ip),
      })
      return { ok: true, previousPlan: previous?.plan, newPlan: input.plan }
    }),

  // ---------------------------------------------------------------------
  // New admin endpoints (compliance / branding / breach).
  // ---------------------------------------------------------------------

  /**
   * Aggregate compliance overview:
   *  - How many doctors have accepted the current legal version.
   *  - Pending data export & deletion requests (admin must action these).
   *  - Open breach incidents.
   *  - Consent acceptance totals by document slug.
   */
  complianceOverview: adminProcedure.query(async ({ ctx }) => {
    const [
      totalDoctors,
      doctorsWithConsent,
      pendingExports,
      pendingDeletions,
      openBreaches,
      legalVersions,
      consentBySlug,
    ] = await Promise.all([
      ctx.db.doctor.count(),
      ctx.db.doctor.count({ where: { currentLegalVersion: { not: null } } }),
      ctx.db.dataExportRequest.count({ where: { status: { in: ["REQUESTED", "READY"] } } }),
      ctx.db.dataDeletionRequest.count({ where: { status: "REQUESTED" } }),
      ctx.db.breachIncident.count({
        where: { status: { in: ["INVESTIGATING", "CONTAINED", "NOTIFIED"] } },
      }),
      ctx.db.legalVersion.findMany({ orderBy: { effectiveAt: "desc" } }),
      ctx.db.consentAcceptance.groupBy({
        by: ["slug", "version"],
        _count: { _all: true },
      }),
    ])

    return {
      doctorsTotal: totalDoctors,
      doctorsWithConsent,
      doctorsWithoutConsent: totalDoctors - doctorsWithConsent,
      pendingExports,
      pendingDeletions,
      openBreaches,
      legalVersions,
      consentBySlug,
    }
  }),

  /** Breach incident ledger — admin-only CRUD. */
  listBreachIncidents: adminProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.breachIncident.findMany({
        where: input?.status ? { status: input.status } : undefined,
        orderBy: { detectedAt: "desc" },
      })
    }),

  createBreachIncident: adminProcedure
    .input(
      z.object({
        slug: z.string().min(3).max(80),
        title: z.string().min(3).max(200),
        severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
        detectedAt: z.string().datetime().optional(),
        affectedUsers: z.number().int().min(0).default(0),
        affectedWorkspaces: z.number().int().min(0).default(0),
        dataCategories: z.array(z.string()).default([]),
        description: z.string().min(10).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const detectedAt = input.detectedAt ? new Date(input.detectedAt) : new Date()
      const ip = (await captureContext()).ip
      const created = await ctx.db.breachIncident.create({
        data: {
          slug: input.slug,
          title: input.title,
          severity: input.severity,
          status: "INVESTIGATING",
          detectedAt,
          affectedUsers: input.affectedUsers,
          affectedWorkspaces: input.affectedWorkspaces,
          dataCategories: input.dataCategories,
          description: input.description,
          reportedBy: ADMIN_EMAIL,
        },
      })
      safeLog("warn", "admin.breach_incident_created", {
        slug: created.slug,
        severity: created.severity,
        affectedUsers: created.affectedUsers,
        ip: truncateIp(ip),
      })
      return created
    }),

  updateBreachStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["INVESTIGATING", "CONTAINED", "NOTIFIED", "CLOSED"]),
        rootCause: z.string().optional(),
        remediation: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, rootCause, remediation } = input
      const data: Record<string, unknown> = { status }
      const now = new Date()
      if (status === "CONTAINED") data.containedAt = now
      if (status === "NOTIFIED") data.notifiedAt = now
      if (status === "CLOSED") data.closedAt = now
      if (rootCause) data.rootCause = rootCause
      if (remediation) data.remediation = remediation
      return ctx.db.breachIncident.update({ where: { id }, data })
    }),

  /** Branding config (placeholder for future per-platform branding). */
  getBranding: adminProcedure.query(async ({ ctx }) => {
    // We don't have a PlatformConfig model yet — return a sensible default.
    return {
      operatorName: "Yoguitech.LLC",
      operatorTagline: "Sistema de Gestión Médica para Venezuela",
      contactEmail: "yoguitech@gmail.com",
      supportEmail: "yoguitech@gmail.com",
      primaryColor: "#f59e0b",
      accentColor: "#0ea5e9",
      legalNotice:
        "© 2026 Yoguitech.LLC — Todos los derechos reservados. Operador conforme a la LOPDP de Venezuela.",
    }
  }),

  sendPaymentReminder: adminProcedure
    .input(z.object({ doctorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspaces = await ctx.db.workspace.findMany({
        where: { doctorId: input.doctorId },
        select: { id: true },
      })

      if (workspaces.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Doctor has no workspaces" })
      }

      // Create a notification for each workspace of the doctor
      await ctx.db.notification.createMany({
        data: workspaces.map((ws) => ({
          workspaceId: ws.id,
          tipo: "SYSTEM",
          titulo: "Suscripción Vencida",
          mensaje: "Su suscripción a MedSysVE se encuentra vencida. Por favor regularice su pago para evitar suspensión del servicio.",
          referenciaId: "BILLING_REMINDER",
        })),
      })

      return { ok: true }
    }),
})
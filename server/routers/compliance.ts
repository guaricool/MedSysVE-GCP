import { z } from "zod"
import { createHash, randomBytes } from "crypto"
import { router, doctorProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { db } from "@/lib/db"
import { audit } from "@/lib/audit"
import { headers } from "next/headers"
import { decryptField, hmacIndex } from "@/lib/field-crypto"
import { readEncounterMotivo } from "@/lib/encounter-crypto"

function truncateIp(ip: string): string {
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 3).join(":") + ":0:0:0:0:0"
  }
  const parts = ip.split(".")
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`
  return ip
}

async function captureContext() {
  const hdrs = await headers()
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown"
  return {
    ip: truncateIp(ip),
    userAgent: hdrs.get("user-agent") ?? null,
  }
}

/**
 * LOPDP Art. 60 — Derecho de Acceso / Portabilidad.
 *
 * Two scopes:
 *  - PATIENT_FULL: every clinical row attached to a given patient (by HMAC).
 *  - DOCTOR_FULL: the doctor's own profile, workspaces, acceptances, etc.
 *
 * The download is generated server-side (this is a placeholder that produces
 * a JSON payload with the patient's data) and a signed token is returned.
 * In production you'd push this to S3/MinIO and return a presigned URL.
 */
export const complianceRouter = router({
  requestPatientExport: doctorProcedure
    .input(z.object({ cedula: z.string().min(6).max(15) }))
    .mutation(async ({ ctx, input }) => {
      const ip = await captureContext()
      const hmac = hmacIndex(input.cedula)

      // Tenant isolation: locate the Patient ONLY if they have a registration
      // in this workspace. Otherwise we 404 with the same message regardless
      // of whether the cédula exists in another workspace — this prevents
      // doctor A from probing whether a person is registered with doctor B.
      //
      // Patients are workspace-scoped since migration 20260626130000, so we
      // find the registration first (which IS workspace-scoped) and only
      // then load the Patient row that registration points at.
      const registration = await ctx.db.patientRegistration.findFirst({
        where: {
          workspaceId: ctx.session.workspaceId,
          patient: { hmacCedula: hmac },
        },
        select: { patientId: true },
      })
      if (!registration) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado" })
      }

      const patient = await ctx.db.patient.findUnique({
        where: { id: registration.patientId },
      })
      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado" })
      }

      // Find registrations inside the current workspace only.
      const regs = await ctx.db.patientRegistration.findMany({
        where: { workspaceId: ctx.session.workspaceId, patientId: patient.id },
        include: {
          encounters: {
            include: {
              diagnoses: true,
              prescriptions: { include: { items: { include: { medication: true } } } },
              labOrders: true,
              imagingOrders: true,
              documents: { select: { id: true, tipo: true, firmadoAt: true } },
              invoices: true,
              consents: { include: { template: { select: { titulo: true } } } },
            },
            orderBy: { createdAt: "asc" },
          },
          alergias: true,
          vaccines: true,
          appointments: { orderBy: { fechaHora: "asc" } },
          mensajes: { orderBy: { creadoAt: "asc" } },
          insurances: { include: { provider: true } },
          tags: true,
        },
      })

      const exportPayload = {
        generatedAt: new Date().toISOString(),
        legalBasis: "LOPDP Art. 60 — Derecho de Acceso y Portabilidad",
        operator: "Yoguitech.LLC",
        subject: {
          nombre: patient.nombre,
          apellido: patient.apellido,
          fechaNacimiento: patient.fechaNacimiento,
          sexo: patient.sexo,
          // Decrypted only inside the JSON; the column itself is encrypted at rest.
          numeroIdentificacion: patient.numeroIdentificacion
            ? safeDecrypt(patient.numeroIdentificacion)
            : null,
          tipoIdentificacion: patient.tipoIdentificacion,
        },
        registrations: regs.map((r) => ({
          workspaceId: r.workspaceId,
          idDisplay: r.idDisplay,
          createdAt: r.createdAt,
          antecedentes: r.antecedentes,
          notasInternas: r.notasInternas,
          encounters: r.encounters.map((e) => ({
            id: e.id,
            createdAt: e.createdAt,
            status: e.status,
            motivo: readEncounterMotivo(e),
            // Clinical content stays encrypted in the database, but for the
            // export we decrypt it so the patient can read it.
            historiaClinica: e.historiaClinicaCifrada ? safeDecrypt(e.historiaClinicaCifrada) : null,
            plan: e.planCifrado ? safeDecrypt(e.planCifrado) : null,
            vitales: e.vitales,
            examenFisico: e.examenFisico,
            signedAt: e.signedAt,
            diagnoses: e.diagnoses,
            prescriptions: e.prescriptions,
            labOrders: e.labOrders,
            imagingOrders: e.imagingOrders,
            documents: e.documents,
            invoices: e.invoices,
            consents: e.consents,
          })),
          allergies: r.alergias,
          vaccines: r.vaccines,
          appointments: r.appointments,
          mensajes: r.mensajes.map((m) => ({
            autor: m.autor,
            creadoAt: m.creadoAt,
            texto: m.texto,
          })),
          insurances: r.insurances,
          tags: r.tags,
        })),
      }

      const token = randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

      // In production: upload exportPayload to private storage and set
      // downloadUrl to a presigned URL. Here we return the JSON inline so
      // the user can verify the data shape end-to-end.
      const request = await ctx.db.dataExportRequest.create({
        data: {
          doctorId: ctx.session.doctorId,
          patientCedulaHMAC: hmac,
          scope: "PATIENT_FULL",
          status: "READY",
          downloadToken: token,
          downloadUrl: null, // see below
          expiresAt,
          readyAt: new Date(),
          ip: ip.ip,
          notes: "Exportación generada en línea — pendiente de subida a storage.",
        },
      })

      await audit("DATA_EXPORT_GDPR", {
        workspaceId: ctx.session.workspaceId,
        userId: ctx.session.doctorId,
        userRole: ctx.session.role,
        resourceType: "Patient",
        resourceId: patient.id,
        patientId: patient.id,
        ip: ip.ip,
        userAgent: ip.userAgent,
        channel: "API",
        metadata: { requestId: request.id, scope: "PATIENT_FULL" },
      })

      return {
        requestId: request.id,
        token,
        expiresAt,
        // The JSON is returned inline for client-side download. In production
        // this would be a presigned URL pointing at the same payload in
        // private storage.
        payload: JSON.parse(JSON.stringify(exportPayload)) as Record<string, unknown>,
      }
    }),

  requestDeletion: doctorProcedure
    .input(
      z.object({
        cedula: z.string().min(6).max(15),
        reason: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ip = await captureContext()
      const hmac = hmacIndex(input.cedula)

      // Tenant isolation: same as requestPatientExport. We must find the
      // Patient via a PatientRegistration in this workspace — finding by
      // hmacCedula alone would let doctor A probe whether a person is
      // registered with doctor B and trigger a deletion request across
      // tenant boundaries.
      const registration = await ctx.db.patientRegistration.findFirst({
        where: {
          workspaceId: ctx.session.workspaceId,
          patient: { hmacCedula: hmac },
        },
        select: { patientId: true },
      })
      if (!registration) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado" })
      }

      const patient = await ctx.db.patient.findUnique({
        where: { id: registration.patientId },
      })
      if (!patient) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Paciente no encontrado" })
      }

      const tombstoneId = `ANON-${createHash("sha256")
        .update(patient.id + Date.now().toString())
        .digest("hex")
        .slice(0, 12)
        .toUpperCase()}`

      const request = await ctx.db.dataDeletionRequest.create({
        data: {
          doctorId: ctx.session.doctorId,
          patientCedulaHMAC: hmac,
          status: "REQUESTED",
          reason: input.reason,
          ip: ip.ip,
          tombstoneId,
        },
      })

      await audit("DATA_DELETE_GDPR", {
        workspaceId: ctx.session.workspaceId,
        userId: ctx.session.doctorId,
        userRole: ctx.session.role,
        resourceType: "Patient",
        resourceId: patient.id,
        patientId: patient.id,
        ip: ip.ip,
        userAgent: ip.userAgent,
        channel: "API",
        outcome: "ALLOWED",
        metadata: { requestId: request.id, tombstoneId, status: "REQUESTED" },
      })

      return {
        requestId: request.id,
        tombstoneId,
        status: "REQUESTED",
        notice:
          "La solicitud fue registrada. Un administrador debe aprobarla antes de aplicar la anonimización (no destruimos datos clínicos, los anonimizamos de forma irreversible para preservar el historial de auditoría).",
      }
    }),

  listMyExports: doctorProcedure.query(async ({ ctx }) => {
    return ctx.db.dataExportRequest.findMany({
      where: { doctorId: ctx.session.doctorId },
      orderBy: { requestedAt: "desc" },
      take: 25,
    })
  }),

  listMyDeletions: doctorProcedure.query(async ({ ctx }) => {
    return ctx.db.dataDeletionRequest.findMany({
      where: { doctorId: ctx.session.doctorId },
      orderBy: { requestedAt: "desc" },
      take: 25,
    })
  }),
})

function safeDecrypt(ciphertext: string): string | null {
  try {
    return decryptField(ciphertext)
  } catch {
    // Column might still be in plaintext (legacy). Return as-is.
    if (/^[\d\s\-]+$/.test(ciphertext)) return ciphertext
    return null
  }
}

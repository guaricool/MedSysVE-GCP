import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { differenceInYears } from "date-fns"
import { renderToBuffer } from "@react-pdf/renderer"
import { EncounterSummaryPdf } from "@/lib/pdf/encounter-summary-pdf"
import { urlToFsPath , buildPdfBranding} from "@/lib/pdf/header-logic"
import { pdfFilename } from "@/lib/pdf/filename"
import React from "react"
import type { SessionUser } from "@/types"
import { auditFromHeaders } from "@/lib/audit"
import { formatDoctorName } from "@/lib/doctor-utils"
import { decryptField } from "@/lib/field-crypto"
import { readPatientCedula } from "@/lib/patient-crypto"
import { readEncounterMotivo } from "@/lib/encounter-crypto"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as SessionUser

  const { id } = await params
  const omitSello = user.role === "PATIENT" && req.nextUrl.searchParams.get("preview") === "1"

  if (id === "sandbox-demo-enc") {
    const doc = await db.doctor.findFirst({
      where: { email: user.email },
      include: { reportPreferences: true }
    })
    const ws = await db.workspace.findFirst({
      where: { doctorId: doc?.id },
      include: { clinic: true, doctor: { include: { reportPreferences: true } } }
    })
    
    const mockDoctor = ws?.doctor || doc || {
      prefijo: "Dr.",
      nombre: (user as any).name || "Carlos Pierluissi",
      apellido: "",
      especialidadPrincipal: "Medicina General & Especializada",
      cedula: "V-12345678",
      email: user.email || "admin@medsysve.com",
      telefono: "+58 412-1234567",
      subEspecialidades: "Sandbox Demo",
    }
    
    const buffer = await renderToBuffer(
      React.createElement(EncounterSummaryPdf, {
        branding: buildPdfBranding({ doctor: mockDoctor as any, clinic: ws?.clinic as any, workspace: ws as any }),
        doctor: {
          prefijo: mockDoctor.prefijo || "Dr.",
          nombre: formatDoctorName(mockDoctor as any) || (user as any).name || "Doctor MedSysVE",
          especialidad: mockDoctor.especialidadPrincipal || "Especialidad Médica",
          cedula: mockDoctor.cedula || undefined,
          email: mockDoctor.email || undefined,
          telefono: mockDoctor.telefono || undefined,
        },
        clinic: ws?.clinic ? {
          nombre: ws.clinic.nombre,
          direccion: ws.clinic.direccion ?? undefined,
          telefono: ws.clinic.telefono ?? undefined,
          email: ws.clinic.email ?? undefined,
          rif: ws.clinic.rif ?? undefined,
        } : null,
        patient: {
          nombre: "Camila",
          apellido: "Pérez (Demo Sandbox)",
          edad: 26,
          sexo: "Femenino",
          grupoSanguineo: "O+",
          cedula: "V-26123456",
          telefono: "+58 414-9876543",
        },
        encounter: {
          fecha: new Date().toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: 'America/Caracas' }),
          motivo: "Evaluación Médica de Demostración en Sandbox",
          historiaClinica: "Paciente acude para evaluación de control especializado en plataforma MedSysVE.",
          examenFisico: "Paciente vigil, orientada en tiempo, espacio y persona. Normocéfala, cardiopulmonar sin agregados.",
          plan: "Indicaciones médicas de prueba y seguimiento especializado.",
          vitales: { paSistolica: 120, paDiastolica: 80, fc: 72, fr: 16, temp: 36.5, spo2: 98, peso: 62, talla: 165, imc: 22.8 },
          diagnoses: [{ codigoCie10: "Z00.0", descripcion: "Examen médico general de control", tipo: "PRESUNTIVO" }],
          medications: [],
          labOrders: [],
          imagingOrders: [],
          datosEspecialidad: {
            evaluacion: "Demo Sandbox MedSysVE",
            escala: "Excelente estado clínico",
          },
        },
        generadoEl: new Date().toLocaleDateString("es-VE", { timeZone: 'America/Caracas' }),
        activeSections: undefined,
        omitSello,
      }) as any,
    )

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="informe-demo-sandbox.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    })
  }

  // Build the where clause depending on session role
  // Patients can only access encounters for their own registrations
  const signedStatuses = ["SIGNED", "AMENDED"] as ("SIGNED" | "AMENDED")[]
  const whereClause =
    user.role === "PATIENT"
      ? {
          id,
          status: { in: signedStatuses },
          patientRegistration: { patient: { id: user.patientId } },
        }
      : { id, workspaceId: user.workspaceId, status: { in: signedStatuses } }

  const enc = await db.encounter.findFirst({
    where: whereClause,
    include: {
      patientRegistration: { include: { patient: true } },
      diagnoses: { orderBy: { createdAt: "asc" } },
      prescriptions: {
        include: { items: { include: { medication: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      labOrders: { orderBy: { createdAt: "asc" } },
      imagingOrders: { orderBy: { createdAt: "asc" } },
    },
  })
  if (!enc) {
    await auditFromHeaders("ACCESS_DENIED", {
      userId: user.id,
      userRole: user.role,
      workspaceId: user.workspaceId || "",
      resourceType: "Encounter",
      resourceId: id,
      outcome: "DENIED",
      reason: "Not found or not accessible",
      channel: "PDF",
    }, req.headers)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const ws = await db.workspace.findUnique({
    where: { id: enc.workspaceId },
    include: {
      clinic: true,
      doctor: {
        include: { reportPreferences: true },
      },
    },
  })
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Resolve active sections for the report PDF
  let activeSections: string[] | undefined = undefined
  if (enc.reportOverride && Array.isArray(enc.reportOverride)) {
    activeSections = enc.reportOverride as string[]
  } else if (ws.doctor.reportPreferences?.secciones) {
    const secs: string[] = []
    const p = ws.doctor.reportPreferences.secciones as Record<string, boolean>
    if (p.motivoConsulta || p.historiaClinica) secs.push("subjetivo")
    if (p.signosVitales) secs.push("objetivo")
    if (p.examenFisico) secs.push("examen")
    if (p.diagnosticos) secs.push("analisis")
    if (p.planTratamiento) secs.push("plan")
    if (p.tratamientoIndicado) secs.push("receta")
    if (p.ordenesLaboratorio) secs.push("lab-order")
    if (p.ordenesImagenes) secs.push("imaging")
    activeSections = secs
  }

  // Audit successful PDF export BEFORE generating the buffer. This ensures
  // the access trail is recorded even if renderToBuffer throws downstream.
  await auditFromHeaders("EXPORT_PDF_ENCOUNTER", {
    userId: user.id,
    userRole: user.role,
    workspaceId: user.workspaceId || ws.id,
    resourceType: "Encounter",
    resourceId: enc.id,
    patientId: enc.patientRegistrationId,
    channel: "PDF",
  }, req.headers)

  // Decrypt PHI fields. Fall back to legacy plaintext only if decryption
  // fails (i.e. row was written before encryption was wired) so the PDF
  // generator still produces something — operators can re-run the
  // migration to convert legacy rows.
  const decryptedAnamnesis = enc.historiaClinicaCifrada
    ? safeDecrypt(enc.historiaClinicaCifrada) ?? enc.historiaClinica ?? undefined
    : enc.historiaClinica ?? undefined
  const decryptedPlan = enc.planCifrado
    ? safeDecrypt(enc.planCifrado) ?? enc.plan ?? undefined
    : enc.plan ?? undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = enc as any
  const pat = e.patientRegistration.patient
  const edad = differenceInYears(new Date(), new Date(pat.fechaNacimiento))
  const pres = e.prescriptions[0]

  const buffer = await renderToBuffer(
    React.createElement(EncounterSummaryPdf, {
      branding: buildPdfBranding({ doctor: ws.doctor, clinic: ws.clinic, workspace: ws }),
      doctor: {
        prefijo: ws.doctor.prefijo,
        nombre: formatDoctorName(ws.doctor),
        especialidad: ws.doctor.especialidadPrincipal ?? undefined,
        cedula: ws.doctor.cedula ?? undefined,
        email: ws.doctor.email ?? undefined,
        telefono: ws.doctor.telefono ?? ws.telefono ?? undefined,
        subEspecialidades: ws.doctor.subEspecialidades,
      },
      clinic: ws.clinic
        ? {
            nombre: ws.clinic.nombre,
            direccion: ws.clinic.direccion ?? undefined,
            telefono: ws.clinic.telefono ?? undefined,
            email: ws.clinic.email ?? undefined,
            rif: ws.clinic.rif ?? undefined,
          }
        : null,
      patient: {
        nombre: pat.nombre,
        apellido: pat.apellido,
        edad,
        sexo: pat.sexo,
        grupoSanguineo: pat.grupoSanguineo ?? undefined,
        cedula: readPatientCedula(pat),
        telefono: pat.telefono ?? undefined,
      },
      encounter: {
        fecha: new Date(e.createdAt).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: 'America/Caracas' }),
        motivo: readEncounterMotivo(e),
        historiaClinica: decryptedAnamnesis ?? undefined,
        examenFisico: typeof e.examenFisico === "string" ? e.examenFisico : undefined,
        plan: decryptedPlan ?? undefined,
        vitales: (e.vitales as Record<string, number | null> | null) ?? undefined,
        diagnoses: (e.diagnoses as any[]).map((d: any) => ({
          codigoCie10: d.codigoCie10,
          descripcion: d.descripcion,
          tipo: d.tipo,
        })),
        medications: ((pres?.items ?? []) as any[]).map((it: any) => ({
          nombreGenerico: it.medication.nombreGenerico,
          concentracion: it.concentracion,
          dosis: it.dosis,
          frecuencia: it.frecuencia,
          duracion: it.duracion,
          instrucciones: it.instrucciones ?? undefined,
        })),
        labOrders: (e.labOrders as any[]).map((lo: any) => ({
          estudios: lo.estudios as string[],
          urgente: lo.urgente,
          indicacionesClinicas: lo.indicacionesClinicas ?? undefined,
        })),
        imagingOrders: (e.imagingOrders as any[]).map((io: any) => ({
          tipoImagen: io.tipoImagen,
          region: io.region,
          urgente: io.urgente,
          indicacionesClinicas: io.indicacionesClinicas ?? undefined,
        })),
        // Specialty-specific data — always included when present so the
        // PDF reflects the full clinical picture from specialty forms.
        datosEspecialidad: (e.datosEspecialidad as Record<string, unknown> | null) ?? undefined,
      },
      generadoEl: new Date().toLocaleDateString("es-VE", { timeZone: 'America/Caracas' }),
      activeSections,
      omitSello,
    }) as any,
  )

  const filename = (omitSello ? "preview-" : "") + pdfFilename("informe", pat.nombre, pat.apellido, new Date(e.createdAt))
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": buffer.length.toString(),
    },
  })
}

/**
 * Defensive decrypt: returns null on GCM auth-tag failure rather than
 * throwing. Caller decides fallback policy.
 */
function safeDecrypt(ciphertext: string): string | null {
  try {
    return decryptField(ciphertext) ?? null
  } catch {
    return null
  }
}

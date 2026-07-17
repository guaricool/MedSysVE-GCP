import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { differenceInYears } from "date-fns"
import { renderToBuffer } from "@react-pdf/renderer"
import { HistoryPdf } from "@/lib/pdf/history-pdf"
import { urlToFsPath , buildPdfBranding} from "@/lib/pdf/header-logic"
import { pdfFilename } from "@/lib/pdf/filename"
import React from "react"
import type { SessionUser } from "@/types"
import { auditFromHeaders } from "@/lib/audit"
import { readPatientCedula } from "@/lib/patient-crypto"
import { readEncounterMotivo } from "@/lib/encounter-crypto"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientRegId: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as SessionUser
  const { patientRegId } = await params

  const reg = await db.patientRegistration.findFirst({
    where: { id: patientRegId, workspaceId: user.workspaceId },
    include: {
      patient: true,
      encounters: {
        include: {
          diagnoses: true,
          prescriptions: { include: { items: { include: { medication: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await auditFromHeaders("EXPORT_PDF_HISTORY", {
    userId: user.id,
    userRole: user.role,
    workspaceId: user.workspaceId,
    resourceType: "PatientRegistration",
    resourceId: reg.id,
    patientId: reg.patientId,
    channel: "PDF",
  }, req.headers)

  const workspace = await db.workspace.findUnique({
    where: { id: user.workspaceId },
    include: { clinic: true, doctor: true },
  })
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const edad = differenceInYears(new Date(), new Date(reg.patient.fechaNacimiento))
  const encounters = reg.encounters.map((enc) => ({
    createdAt: enc.createdAt.toISOString(),
    motivo: readEncounterMotivo(enc),
    diagnoses: enc.diagnoses.map((d) => ({
      codigoCie10: d.codigoCie10,
      descripcion: d.descripcion,
    })),
    medications: enc.prescriptions.flatMap((p) =>
      p.items.map((it) => ({
        nombreGenerico: it.medication.nombreGenerico,
        concentracion: it.concentracion,
        dosis: it.dosis,
        frecuencia: it.frecuencia,
        duracion: it.duracion,
      })),
    ),
  }))

  const buffer = await renderToBuffer(
    React.createElement(HistoryPdf, {
      branding: buildPdfBranding({ doctor: workspace.doctor, clinic: workspace.clinic, workspace: workspace }),
      doctor: {
        nombre: `${workspace.doctor.nombre} ${workspace.doctor.apellido}`,
        especialidad: workspace.doctor.especialidadPrincipal,
        cedula: workspace.doctor.cedula,
        email: workspace.doctor.email,
        telefono: workspace.doctor.telefono ?? workspace.telefono ?? undefined,
        subEspecialidades: workspace.doctor.subEspecialidades,
      },
      clinic: workspace.clinic
        ? {
            nombre: workspace.clinic.nombre,
            direccion: workspace.clinic.direccion ?? undefined,
            telefono: workspace.clinic.telefono ?? undefined,
            email: workspace.clinic.email ?? undefined,
            rif: workspace.clinic.rif ?? undefined,
          }
        : null,
      patient: {
        nombre: reg.patient.nombre,
        apellido: reg.patient.apellido,
        edad,
        sexo: reg.patient.sexo,
        cedula: readPatientCedula(reg.patient),
        telefono: reg.patient.telefono ?? undefined,
      },
      fecha: new Date().toLocaleDateString("es-VE", { timeZone: "America/Caracas" }),
      encounters,
    }) as any,
  )

  const filename = pdfFilename("historial", reg.patient.nombre, reg.patient.apellido, new Date())
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": buffer.length.toString(),
    },
  })
}

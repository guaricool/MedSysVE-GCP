import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { differenceInYears } from "date-fns"
import { renderToBuffer } from "@react-pdf/renderer"
import { DocumentPdf } from "@/lib/pdf/document-pdf"
import { urlToFsPath , buildPdfBranding} from "@/lib/pdf/header-logic"
import { pdfFilename } from "@/lib/pdf/filename"
import React from "react"
import type { SessionUser } from "@/types"
import { auditFromHeaders } from "@/lib/audit"
import { readPatientCedula } from "@/lib/patient-crypto"

const TIPO_SLUG: Record<string, string> = {
  INFORME: "informe",
  REPOSO: "reposo",
  REFERIDO: "referido",
  CERTIFICADO: "certificado",
  RECETA: "receta",
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as SessionUser
  const { id } = await params

  // Patient-portal "preview without firma/sello" toggle. Doctors/staff
  // always get the full legal copy. Set via ?preview=1 on the URL; the
  // omitSello prop flows down to the PDF generator which strips the
  // signature line + sello image and adds an explicit "VISTA PREVIA"
  // watermark. (Carlos 2026-07-07)
  const omitSello = user.role === "PATIENT" && req.nextUrl.searchParams.get("preview") === "1"

  const doc = await db.document.findFirst({
    where:
      user.role === "PATIENT"
        ? { id, visibleEnPortal: true, patientRegistration: { patient: { id: user.patientId } } }
        : // Doctor access — same workspace OR the doctor is the referral
          // recipient of this REFERIDO document (cross-workspace by design).
          {
            id,
            OR: [
              { patientRegistration: { workspaceId: user.workspaceId } },
              { tipo: "REFERIDO", referidoADoctorId: user.doctorId ?? undefined },
            ],
          },
    include: {
      patientRegistration: {
        include: {
          patient: true,
          workspace: { include: { clinic: true, doctor: true } },
        },
      },
    },
  })
  if (!doc) {
    await auditFromHeaders("ACCESS_DENIED", {
      userId: user.id,
      userRole: user.role,
      workspaceId: user.workspaceId || "",
      resourceType: "Document",
      resourceId: id,
      outcome: "DENIED",
      reason: "Not found or not accessible",
      channel: "PDF",
    }, req.headers)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await auditFromHeaders("EXPORT_PDF_DOCUMENT", {
    userId: user.id,
    userRole: user.role,
    workspaceId: user.workspaceId,
    resourceType: "Document",
    resourceId: doc.id,
    patientId: doc.patientRegistrationId,
    channel: "PDF",
  }, req.headers)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = doc as any
  const ws = d.patientRegistration.workspace
  const pat = d.patientRegistration.patient
  const edad = differenceInYears(new Date(), new Date(pat.fechaNacimiento))

  const buffer = await renderToBuffer(
    React.createElement(DocumentPdf, {
      branding: buildPdfBranding({ doctor: ws.doctor, clinic: ws.clinic, workspace: ws }),
      doctor: {
        nombre: `Dr. ${ws.doctor.nombre} ${ws.doctor.apellido}`,
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
      tipo: d.tipo,
      paciente: {
        nombre: pat.nombre,
        apellido: pat.apellido,
        edad,
        cedula: readPatientCedula(pat),
      },
      fecha: new Date(d.createdAt).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: 'America/Caracas' }),
      contenidoHtml: d.contenidoHtml,
      // Surface referral target on the PDF so the receiving doctor sees
      // "To: Dr. X (Especialidad)" instead of just the body content.
      referidoA: d.tipo === "REFERIDO" && d.referidoANombre
        ? {
            nombre: d.referidoANombre as string,
            especialidad: (d.referidoAEspecialidad as string | null | undefined) ?? undefined,
            telefono: (d.referidoATelefono as string | null | undefined) ?? undefined,
          }
        : undefined,
      omitSello,
    }) as any,
  )

  const tipo = TIPO_SLUG[String(d.tipo)] ?? String(d.tipo).toLowerCase()
  // Preview downloads get a "_preview" filename suffix so the patient
  // doesn't confuse them with the doctor-signed copy.
  const filename = (omitSello ? "preview-" : "") + pdfFilename(tipo, pat.nombre, pat.apellido, new Date(d.createdAt))
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": buffer.length.toString(),
    },
  })
}

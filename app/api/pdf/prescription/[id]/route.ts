import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { differenceInYears } from "date-fns"
import { renderToBuffer } from "@react-pdf/renderer"
import { PrescriptionPdf } from "@/lib/pdf/prescription-pdf"
import { urlToFsPath , buildPdfBranding} from "@/lib/pdf/header-logic"
import { pdfFilename } from "@/lib/pdf/filename"
import React from "react"
import type { SessionUser } from "@/types"
import { auditFromHeaders } from "@/lib/audit"
import { readPatientCedula } from "@/lib/patient-crypto"

import { formatDoctorName } from "@/lib/doctor-utils"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as SessionUser
  const { id } = await params

  // Patient-portal preview toggle: ?preview=1 strips firma/sello. See
  // app/api/pdf/document/[id]/route.ts for the rationale — same pattern.
  const omitSello = user.role === "PATIENT" && req.nextUrl.searchParams.get("preview") === "1"

  const pres = await db.prescription.findFirst({
    where:
      user.role === "PATIENT"
        ? { id, encounter: { status: { in: ["SIGNED", "AMENDED"] }, patientRegistration: { patient: { id: user.patientId } } } }
        : { id, encounter: { workspaceId: user.workspaceId } },
    include: {
      encounter: {
        include: {
          patientRegistration: {
            include: {
              patient: true,
              alergias: {
                where: { activa: true },
                select: { sustancia: true, gravedad: true, reaccion: true },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      },
      items: { include: { medication: true } },
    },
  })
  if (!pres) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await auditFromHeaders("EXPORT_PDF_PRESCRIPTION", {
    userId: user.id,
    userRole: user.role,
    workspaceId: pres.encounter.workspaceId,
    resourceType: "Prescription",
    resourceId: pres.id,
    patientId: pres.encounter.patientRegistrationId,
    channel: "PDF",
  }, req.headers)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = pres as any
  const workspaceId = p.encounter.workspaceId ?? user.workspaceId
  const ws = await db.workspace.findUnique({ where: { id: workspaceId }, include: { clinic: true, doctor: true } })
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const pat = p.encounter.patientRegistration.patient
  const edad = differenceInYears(new Date(), new Date(pat.fechaNacimiento))

  const buffer = await renderToBuffer(
    React.createElement(PrescriptionPdf, {
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
      paciente: {
        nombre: pat.nombre,
        apellido: pat.apellido,
        edad,
        cedula: readPatientCedula(pat),
      },
      fecha: new Date(p.createdAt).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: 'America/Caracas' }),
      // Patient's active allergies (drug-allergy safety surface on the
      // printed receta). Empty array → no banner.
      alergias: (p.encounter.patientRegistration as { alergias?: Array<{ sustancia: string; gravedad: "LEVE" | "MODERADA" | "SEVERA" | null; reaccion: string | null }> }).alergias ?? [],
      items: p.items.map((it: any) => ({
        nombreGenerico: it.medication.nombreGenerico,
        concentracion: it.concentracion,
        dosis: it.dosis,
        frecuencia: it.frecuencia,
        duracion: it.duracion,
        indicacionesEspeciales: it.indicacionesEspeciales ?? undefined,
        overrideAlerta: !!it.overrideAlerta,
      })),
      omitSello,
    }) as any,
  )

  const filename = (omitSello ? "preview-" : "") + pdfFilename("receta", pat.nombre, pat.apellido, new Date(p.createdAt))
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}

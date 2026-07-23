import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { differenceInYears } from "date-fns"
import { renderToBuffer } from "@react-pdf/renderer"
import { ImagingOrderPdf } from "@/lib/pdf/imaging-order-pdf"
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

  const order = await db.imagingOrder.findFirst({
    where:
      user.role === "PATIENT"
        ? { id, encounter: { status: { in: ["SIGNED", "AMENDED"] }, patientRegistration: { patient: { id: user.patientId } } } }
        : { id, encounter: { workspaceId: user.workspaceId } },
    include: {
      encounter: { include: { patientRegistration: { include: { patient: true } } } },
      items: { orderBy: { orden: "asc" } },
    },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await auditFromHeaders("EXPORT_PDF_IMAGING_ORDER", {
    userId: user.id,
    userRole: user.role,
    workspaceId: order.encounter.workspaceId,
    resourceType: "ImagingOrder",
    resourceId: order.id,
    patientId: order.encounter.patientRegistrationId,
    channel: "PDF",
  }, req.headers)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = order as any
  const workspaceId = o.encounter.workspaceId ?? user.workspaceId
  const ws = await db.workspace.findUnique({ where: { id: workspaceId }, include: { clinic: true, doctor: true } })
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const pat = o.encounter.patientRegistration.patient
  const edad = differenceInYears(new Date(), new Date(pat.fechaNacimiento))

  const buffer = await renderToBuffer(
    React.createElement(ImagingOrderPdf, {
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
      fecha: new Date(o.createdAt).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: 'America/Caracas' }),
      items: (o.items && o.items.length > 0
        ? o.items.map((it: { tipoImagen: string; region: string; notas: string | null }) => ({
            tipoImagen: it.tipoImagen,
            region: it.region,
            notas: it.notas,
          }))
        : [{ tipoImagen: o.tipoImagen, region: o.region, notas: null }]
      ),
      indicacionesClinicas: o.indicacionesClinicas ?? undefined,
      urgente: o.urgente,
      numero: id.slice(0, 8).toUpperCase(),
      omitSello,
    }) as any,
  )

  const filename = (omitSello ? "preview-" : "") + pdfFilename("imagen", pat.nombre, pat.apellido, new Date(o.createdAt))
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": buffer.length.toString(),
    },
  })
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { renderToBuffer } from "@react-pdf/renderer"
import { PrescriptionPdf } from "@/lib/pdf/prescription-pdf"
import { LabOrderPdf } from "@/lib/pdf/lab-order-pdf"
import { ImagingOrderPdf } from "@/lib/pdf/imaging-order-pdf"
import { buildPdfBranding } from "@/lib/pdf/header-logic"
import { pdfFilename } from "@/lib/pdf/filename"
import React from "react"
import type { SessionUser } from "@/types"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as SessionUser
  const { id } = await params

  const order = await db.expressOrder.findFirst({
    where: { id, workspaceId: user.workspaceId },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const ws = await db.workspace.findUnique({
    where: { id: user.workspaceId },
    include: { clinic: true, doctor: true },
  })
  if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  const doctorInfo = {
    nombre: `Dr. ${ws.doctor.nombre} ${ws.doctor.apellido}`,
    especialidad: ws.doctor.especialidadPrincipal ?? undefined,
    cedula: ws.doctor.cedula ?? undefined,
    email: ws.doctor.email ?? undefined,
    telefono: ws.doctor.telefono ?? ws.telefono ?? undefined,
    subEspecialidades: ws.doctor.subEspecialidades,
  }

  const clinicInfo = ws.clinic
    ? {
        nombre: ws.clinic.nombre,
        direccion: ws.clinic.direccion ?? undefined,
        telefono: ws.clinic.telefono ?? undefined,
        email: ws.clinic.email ?? undefined,
        rif: ws.clinic.rif ?? undefined,
      }
    : null

  const branding = buildPdfBranding({ doctor: ws.doctor, clinic: ws.clinic, workspace: ws })
  const fecha = new Date(order.createdAt).toLocaleDateString("es-VE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Caracas",
  })

  const pacienteNombreCompleto = `${order.pacienteNombre} ${order.pacienteApellido}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = order.items as any[]

  let buffer: Buffer
  let filename: string

  if (order.tipo === "RECETA") {
    // Map express prescription items to PrescriptionPdf format
    const prescItems = items.map((it: { medicamento: string; dosis?: string; frecuencia?: string; duracion?: string; notas?: string }) => ({
      nombreGenerico: it.medicamento,
      concentracion: it.dosis ?? "",
      dosis: it.dosis ?? "",
      frecuencia: it.frecuencia ?? "",
      duracion: it.duracion ?? "",
      indicacionesEspeciales: it.notas,
      overrideAlerta: false,
    }))

    buffer = Buffer.from(
      await renderToBuffer(
        React.createElement(PrescriptionPdf, {
          branding,
          doctor: doctorInfo,
          clinic: clinicInfo,
          paciente: {
            nombre: order.pacienteNombre,
            apellido: order.pacienteApellido,
            edad: order.pacienteEdad,
            cedula: order.pacienteCedula ?? undefined,
          },
          fecha,
          items: prescItems,
          alergias: [],
        }) as any
      )
    )
    filename = pdfFilename("receta-express", order.pacienteNombre, order.pacienteApellido, new Date(order.createdAt))
  } else if (order.tipo === "LABORATORIO") {
    const labItems = items.map((it: { estudio: string; notas?: string }, i: number) => ({
      id: String(i),
      estudio: it.estudio,
      notas: it.notas ?? null,
      orden: i,
    }))

    buffer = Buffer.from(
      await renderToBuffer(
        React.createElement(LabOrderPdf, {
          branding,
          doctor: doctorInfo,
          clinic: clinicInfo,
          paciente: {
            nombre: order.pacienteNombre,
            apellido: order.pacienteApellido,
            edad: order.pacienteEdad,
            cedula: order.pacienteCedula ?? undefined,
          },
          fecha,
          estudios: items.map((it: { estudio: string }) => it.estudio),
          indicacionesClinicas: order.indicaciones ?? undefined,
          urgente: false,
          numero: id.slice(0, 8).toUpperCase(),
        }) as any
      )
    )
    filename = pdfFilename("lab-express", order.pacienteNombre, order.pacienteApellido, new Date(order.createdAt))
  } else {
    // IMAGEN
    const imagItems = items.map((it: { tipoImagen: string; region: string; notas?: string }) => ({
      tipoImagen: it.tipoImagen,
      region: it.region,
      notas: it.notas ?? null,
    }))

    buffer = Buffer.from(
      await renderToBuffer(
        React.createElement(ImagingOrderPdf, {
          branding,
          doctor: doctorInfo,
          clinic: clinicInfo,
          paciente: {
            nombre: order.pacienteNombre,
            apellido: order.pacienteApellido,
            edad: order.pacienteEdad,
            cedula: order.pacienteCedula ?? undefined,
          },
          fecha,
          items: imagItems,
          indicacionesClinicas: order.indicaciones ?? undefined,
          urgente: false,
          numero: id.slice(0, 8).toUpperCase(),
        }) as any
      )
    )
    filename = pdfFilename("imagen-express", order.pacienteNombre, order.pacienteApellido, new Date(order.createdAt))
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": buffer.length.toString(),
    },
  })
}

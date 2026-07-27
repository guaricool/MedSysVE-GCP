import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { differenceInYears } from "date-fns"
import { renderToBuffer } from "@react-pdf/renderer"
import { AllergyReportPdf, type PrickItemPdf, type PatchItemPdf } from "@/lib/pdf/allergy-report-pdf"
import { buildPdfBranding } from "@/lib/pdf/header-logic"
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

  // Try finding by PatientRegistration first, or fallback to Encounter
  let reg = await db.patientRegistration.findFirst({
    where:
      user.role === "PATIENT"
        ? { id, patientId: user.patientId }
        : { id, workspaceId: user.workspaceId },
    include: {
      patient: true,
      alergias: {
        where: { activa: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  let targetEncounterId: string | null = null

  if (!reg) {
    // Check if ID is an encounterId
    const enc = await db.encounter.findFirst({
      where:
        user.role === "PATIENT"
          ? { id, patientRegistration: { patientId: user.patientId } }
          : { id, workspaceId: user.workspaceId },
      include: {
        patientRegistration: {
          include: {
            patient: true,
            alergias: {
              where: { activa: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    })
    if (enc) {
      reg = enc.patientRegistration
      targetEncounterId = enc.id
    }
  }

  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await auditFromHeaders("EXPORT_PDF_HISTORY", {
    userId: user.id,
    userRole: user.role,
    workspaceId: reg.workspaceId,
    resourceType: "PatientRegistration",
    resourceId: reg.id,
    patientId: reg.id,
    channel: "PDF",
  }, req.headers)

  const ws = await db.workspace.findUnique({ where: { id: reg.workspaceId }, include: { clinic: true, doctor: true } })
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const pat = reg.patient
  const edad = differenceInYears(new Date(), new Date(pat.fechaNacimiento))
  const nombreCompleto = `${pat.nombre} ${pat.apellido}`.trim()
  const fechaEmision = new Date().toLocaleDateString("es-VE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Caracas",
  })

  // Buscar Prick Test y Patch Test registrados
  const prickRecord = await db.allergyPrickTest.findFirst({
    where: targetEncounterId
      ? { encounterId: targetEncounterId }
      : { patientRegistrationId: reg.id },
    orderBy: { createdAt: "desc" },
  })

  const patchRecord = await db.allergyPatchTest.findFirst({
    where: targetEncounterId
      ? { encounterId: targetEncounterId }
      : { patientRegistrationId: reg.id },
    orderBy: { createdAt: "desc" },
  })

  let prickData = undefined
  if (prickRecord) {
    const items: PrickItemPdf[] = []
    if (prickRecord.dustMitesJson) {
      try {
        const parsed = JSON.parse(prickRecord.dustMitesJson)
        Object.entries(parsed).forEach(([key, val]) => {
          items.push({
            label: key.replace(/_/g, " "),
            category: "Prick Test Estándar",
            papuleMm: Number(val) || 0,
          })
        })
      } catch (e) {}
    }
    if (prickRecord.customItemsJson) {
      try {
        const parsed = JSON.parse(prickRecord.customItemsJson)
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            items.push({
              label: item.label,
              category: item.category || "Personalizado",
              papuleMm: item.papuleMm || 0,
              erythemaMm: item.erythemaMm || 0,
            })
          })
        }
      } catch (e) {}
    }

    if (items.length > 0) {
      prickData = {
        histamineControlMm: prickRecord.histamineControlMm,
        salineControlMm: prickRecord.salineControlMm,
        items,
      }
    }
  }

  let patchData = undefined
  if (patchRecord && patchRecord.itemsJson) {
    try {
      const parsed = JSON.parse(patchRecord.itemsJson)
      if (Array.isArray(parsed)) {
        const items: PatchItemPdf[] = parsed.map((item: any) => ({
          hapteno: item.hapteno,
          fuente: item.fuente,
          resultado: item.resultado || "Neg",
        }))
        patchData = {
          fechaAplicacion: patchRecord.fechaAplicacion ? new Date(patchRecord.fechaAplicacion).toLocaleDateString("es-VE") : undefined,
          fechaLectura: patchRecord.fechaLectura ? new Date(patchRecord.fechaLectura).toLocaleDateString("es-VE") : undefined,
          diagnostico: patchRecord.diagnostico ?? undefined,
          comentarios: patchRecord.comentarios ?? undefined,
          items,
        }
      }
    } catch (e) {}
  }

  const buffer = await renderToBuffer(
    React.createElement(AllergyReportPdf, {
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
        nombre: nombreCompleto,
        cedula: readPatientCedula(pat),
        edad,
      },
      alergias: reg.alergias.map((a) => ({
        id: a.id,
        sustancia: a.sustancia,
        reaccion: a.reaccion,
        categoria: a.categoria,
        gravedad: a.gravedad as "LEVE" | "MODERADA" | "SEVERA",
        activa: a.activa,
        createdAt: a.createdAt,
      })),
      prickTest: prickData,
      patchTest: patchData,
      fechaEmision,
    }) as any,
  )

  const filename = pdfFilename("informe-alergologia", pat.nombre, pat.apellido, new Date())
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=60",
    },
  })
}

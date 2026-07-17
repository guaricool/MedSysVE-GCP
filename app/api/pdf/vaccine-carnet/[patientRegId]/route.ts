import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { differenceInYears } from "date-fns"
import type { SessionUser } from "@/types"
import { auditFromHeaders } from "@/lib/audit"
import { readPatientCedula } from "@/lib/patient-crypto"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientRegId: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as SessionUser

  const { patientRegId } = await params

  const reg = await db.patientRegistration.findFirst({
    where:
      user.role === "PATIENT"
        ? { id: patientRegId, patient: { id: user.patientId } }
        : { id: patientRegId, workspaceId: user.workspaceId },
    include: {
      patient: true,
      vaccines: { orderBy: { fechaAplicacion: "asc" } },
    },
  })
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await auditFromHeaders("EXPORT_PDF_VACCINE_CARNET", {
    userId: user.id,
    userRole: user.role,
    workspaceId: reg.workspaceId,
    resourceType: "PatientRegistration",
    resourceId: reg.id,
    patientId: reg.patientId,
    channel: "PDF",
  }, req.headers)

  const ws = await db.workspace.findUnique({
    where: { id: reg.workspaceId },
    include: { clinic: true, doctor: true },
  })
  if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  const { urlToFsPath } = await import("@/lib/pdf/header-logic")
  const branding = { logoPath: urlToFsPath(ws.logoUrl ?? ws.clinic?.logoUrl) }

  const edad = differenceInYears(new Date(), new Date(reg.patient.fechaNacimiento))

  const { renderToBuffer } = await import("@react-pdf/renderer")
  const { VaccineCarnetPdf } = await import("@/lib/pdf/vaccine-carnet-pdf")
  const { createElement } = await import("react")

  const buffer = await renderToBuffer(
    createElement(VaccineCarnetPdf, {
      branding,
      doctor: {
        nombre: `${ws.doctor.nombre} ${ws.doctor.apellido}`,
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
        nombre: reg.patient.nombre,
        apellido: reg.patient.apellido,
        edad,
        sexo: reg.patient.sexo,
        cedula: readPatientCedula(reg.patient),
        fechaNacimiento: new Date(reg.patient.fechaNacimiento).toLocaleDateString("es-VE", {
          timeZone: "America/Caracas",
        }),
      },
      vaccines: reg.vaccines.map((v) => ({
        vacuna: v.vacuna,
        fechaAplicacion: new Date(v.fechaAplicacion).toLocaleDateString("es-VE", {
          timeZone: "America/Caracas",
        }),
        dosis: v.dosis ?? undefined,
        lote: v.lote ?? undefined,
        proximaDosis: v.proximaDosis
          ? new Date(v.proximaDosis).toLocaleDateString("es-VE", { timeZone: "America/Caracas" })
          : undefined,
        aplicadoPor: v.aplicadoPor ?? undefined,
        notas: v.notas ?? undefined,
      })),
      generadoEl: new Date().toLocaleDateString("es-VE", { timeZone: "America/Caracas" }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
  )

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="carne-vacunas-${reg.patient.nombre}-${reg.patient.apellido}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}

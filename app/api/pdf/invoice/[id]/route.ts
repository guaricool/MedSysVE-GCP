import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { differenceInYears } from "date-fns"
import type { SessionUser } from "@/types"
import { auditFromHeaders } from "@/lib/audit"
import { readPatientCedula } from "@/lib/patient-crypto"

const METODO_LABELS: Record<string, string> = {
  EFECTIVO_USD: "Efectivo USD",
  EFECTIVO_BS: "Efectivo Bs",
  TRANSFERENCIA_BS: "Transferencia Bs",
  ZELLE: "Zelle",
  BINANCE_USDT: "Binance USDT",
  PAGOMOVIL: "Pago Móvil",
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as SessionUser

  const { id } = await params

  const inv = await db.invoice.findFirst({
    where: { id, workspaceId: user.workspaceId },
    include: { patientRegistration: { include: { patient: true } } },
  })
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await auditFromHeaders("EXPORT_PDF_INVOICE", {
    userId: user.id,
    userRole: user.role,
    workspaceId: user.workspaceId,
    resourceType: "Invoice",
    resourceId: inv.id,
    patientId: inv.patientRegistrationId,
    channel: "PDF",
  }, req.headers)

  const workspace = await db.workspace.findUnique({
    where: { id: user.workspaceId },
    include: { clinic: true, doctor: true },
  })
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  const { urlToFsPath } = await import("@/lib/pdf/header-logic")
  const branding = { logoPath: urlToFsPath(workspace.logoUrl ?? workspace.clinic?.logoUrl) }

  const pat = inv.patientRegistration.patient
  const edad = differenceInYears(new Date(), new Date(pat.fechaNacimiento))

  const { renderToBuffer } = await import("@react-pdf/renderer")
  const { InvoicePdf } = await import("@/lib/pdf/invoice-pdf")
  const { createElement } = await import("react")

  const buffer = await renderToBuffer(
    createElement(InvoicePdf, {
      branding,
      doctor: {
        nombre: `${workspace.doctor.nombre} ${workspace.doctor.apellido}`,
        especialidad: workspace.doctor.especialidadPrincipal,
        cedula: workspace.doctor.cedula,
        rif: workspace.doctor.rif ?? undefined,
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
      invoice: {
        numero: inv.numero,
        fecha: new Date(inv.createdAt).toLocaleDateString("es-VE", { timeZone: "America/Caracas" }),
        descripcion: inv.descripcion ?? "Consulta médica",
        montoUsd: Number(inv.montoUsd),
        tasaBcv: Number(inv.tasaBcv),
        montoBs: Number(inv.montoBs),
        metodoPago: METODO_LABELS[inv.metodoPago] ?? inv.metodoPago,
        status: inv.status,
      },
      paciente: {
        nombre: pat.nombre,
        apellido: pat.apellido,
        edad,
        cedula: readPatientCedula(pat),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
  )

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="factura-${inv.numero}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}

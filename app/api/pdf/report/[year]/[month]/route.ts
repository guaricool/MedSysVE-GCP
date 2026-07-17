import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import type { SessionUser } from "@/types"
import { auditFromHeaders } from "@/lib/audit"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as SessionUser
  if (user.role !== "DOCTOR" && user.role !== "SECRETARY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { year: yearStr, month: monthStr } = await params
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  if (!year || !month || month < 1 || month > 12 || year < 2020 || year > 2100) {
    return NextResponse.json({ error: "Invalid date params" }, { status: 400 })
  }

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const invoices = await db.invoice.findMany({
    where: {
      workspaceId: user.workspaceId,
      createdAt: { gte: start, lte: end },
    },
    include: { patientRegistration: { include: { patient: true } } },
    orderBy: { createdAt: "asc" },
  })

  await auditFromHeaders("EXPORT_PDF_INVOICE", {
    userId: user.id,
    userRole: user.role,
    workspaceId: user.workspaceId,
    resourceType: "MonthlyReport",
    channel: "PDF",
    metadata: { year, month, totalInvoices: invoices.length },
  }, req.headers)

  const ws = await db.workspace.findUnique({
    where: { id: user.workspaceId },
    include: { clinic: true, doctor: true },
  })
  if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  const { urlToFsPath } = await import("@/lib/pdf/header-logic")
  const branding = { logoPath: urlToFsPath(ws.logoUrl ?? ws.clinic?.logoUrl) }

  const paid = invoices.filter((i) => i.status === "PAID")
  const totalUsd = paid.reduce((s, i) => s + Number(i.montoUsd), 0)
  const totalBs = paid.reduce((s, i) => s + Number(i.montoBs ?? 0), 0)

  const metodosMap = new Map<string, { count: number; totalUsd: number }>()
  for (const inv of paid) {
    const cur = metodosMap.get(inv.metodoPago) ?? { count: 0, totalUsd: 0 }
    metodosMap.set(inv.metodoPago, { count: cur.count + 1, totalUsd: cur.totalUsd + Number(inv.montoUsd) })
  }
  const porMetodo = Array.from(metodosMap.entries()).map(([metodo, v]) => ({ metodo, ...v }))

  const MES_NOMBRES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
  const mes = `${MES_NOMBRES[month - 1]} ${year}`
  const generadoEl = new Date().toLocaleDateString("es-VE", { timeZone: "America/Caracas" })

  const reportInvoices = invoices.map((inv) => ({
    numero: inv.numero,
    patientName: `${inv.patientRegistration.patient.nombre} ${inv.patientRegistration.patient.apellido}`,
    fecha: new Date(inv.createdAt).toLocaleDateString("es-VE", { timeZone: "America/Caracas" }),
    montoUsd: Number(inv.montoUsd),
    montoBs: Number(inv.montoBs ?? 0),
    metodoPago: inv.metodoPago,
    status: inv.status,
  }))

  const { renderToBuffer } = await import("@react-pdf/renderer")
  const { ReportPdf } = await import("@/lib/pdf/report-pdf")
  const { createElement } = await import("react")

  const buffer = await renderToBuffer(
    createElement(ReportPdf, {
      branding,
      doctor: {
        nombre: `${ws.doctor.nombre} ${ws.doctor.apellido}`,
        especialidad: ws.doctor.especialidadPrincipal,
        cedula: ws.doctor.cedula,
        email: ws.doctor.email,
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
      mes,
      generadoEl,
      totalUsd,
      totalBs,
      totalFacturas: invoices.length,
      totalPagadas: paid.length,
      totalPendientes: invoices.filter((i) => i.status === "PENDING").length,
      totalCanceladas: invoices.filter((i) => i.status === "CANCELLED").length,
      porMetodo,
      invoices: reportInvoices,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
  )

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="reporte-${mes.replace(" ", "-")}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}

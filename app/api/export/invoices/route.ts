import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { SessionUser } from "@/types"
import { auditFromHeaders } from "@/lib/audit"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as SessionUser

  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const invoices = await db.invoice.findMany({
    where: {
      workspaceId: user.workspaceId,
      ...(from || to
        ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    },
    include: { patientRegistration: { include: { patient: true } } },
    orderBy: { createdAt: "desc" },
  })

  await auditFromHeaders("EXPORT_CSV_INVOICES", {
    userId: user.id,
    userRole: user.role,
    workspaceId: user.workspaceId,
    resourceType: "Invoice",
    channel: "EXPORT",
    metadata: { count: invoices.length, from, to },
  }, req.headers)

  const BOM = "﻿"
  const header = "Numero,Fecha,Paciente,Monto USD,Monto Bs,Metodo de Pago,Estado,Fecha de Pago\n"
  const rows = invoices
    .map((inv) => {
      const pat = inv.patientRegistration.patient
      return [
        inv.numero,
        new Date(inv.createdAt).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' }),
        `${pat.nombre} ${pat.apellido}`,
        Number(inv.montoUsd).toFixed(2),
        Number(inv.montoBs).toFixed(2),
        inv.metodoPago ?? "",
        inv.status,
        inv.fechaPago ? new Date(inv.fechaPago).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' }) : "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    })
    .join("\n")

  return new NextResponse(BOM + header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="facturas.csv"',
    },
  })
}

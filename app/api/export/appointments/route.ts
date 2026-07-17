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

  const appointments = await db.appointment.findMany({
    where: {
      workspaceId: user.workspaceId,
      ...(from || to
        ? { fechaHora: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    },
    include: { patientRegistration: { include: { patient: true } } },
    orderBy: { fechaHora: "asc" },
  })

  await auditFromHeaders("EXPORT_CSV_APPOINTMENTS", {
    userId: user.id,
    userRole: user.role,
    workspaceId: user.workspaceId,
    resourceType: "Appointment",
    channel: "EXPORT",
    metadata: { count: appointments.length, from, to },
  }, req.headers)

  const BOM = "﻿"
  const header = "Fecha,Hora,Paciente,Tipo,Estado,Duracion (min),Notas\n"
  const rows = appointments
    .map((a) => {
      const pat = a.patientRegistration?.patient
      const date = new Date(a.fechaHora)
      return [
        date.toLocaleDateString("es-VE", { timeZone: 'America/Caracas' }),
        date.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: 'America/Caracas' }),
        pat ? `${pat.nombre} ${pat.apellido}` : (a.titulo ?? ""),
        a.tipo,
        a.status,
        a.duracionMinutos ?? "",
        a.notas ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    })
    .join("\n")

  return new NextResponse(BOM + header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="citas.csv"',
    },
  })
}

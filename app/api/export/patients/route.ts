import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { SessionUser } from "@/types"
import { auditFromHeaders } from "@/lib/audit"
import { readPatientCedula } from "@/lib/patient-crypto"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as SessionUser

  const regs = await db.patientRegistration.findMany({
    where: { workspaceId: user.workspaceId },
    include: { patient: true },
    orderBy: { createdAt: "asc" },
  })

  // HIPAA §164.312(b): every PHI export must leave a trail. Logged BEFORE
  // returning the response so the access is recorded even if the client
  // disconnects mid-download.
  await auditFromHeaders("EXPORT_CSV_PATIENTS", {
    userId: user.id,
    userRole: user.role,
    workspaceId: user.workspaceId,
    resourceType: "PatientRegistration",
    channel: "EXPORT",
    metadata: { count: regs.length },
  }, req.headers)

  const BOM = "﻿"
  const header =
    "ID,Nombre,Apellido,Fecha Nacimiento,Sexo,Tipo Identificacion,Numero Identificacion,Telefono,Email,Fecha Registro\n"

  const rows = regs
    .map((r) => {
      const p = r.patient
      return [
        r.idDisplay,
        p.nombre,
        p.apellido,
        new Date(p.fechaNacimiento).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' }),
        p.sexo,
        p.sinCedula ? "SIN_CEDULA" : (p.tipoIdentificacion ?? ""),
        p.sinCedula ? "" : (readPatientCedula(p) ?? ""),
        p.telefono ?? "",
        p.email ?? "",
        new Date(r.createdAt).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' }),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    })
    .join("\n")

  return new NextResponse(BOM + header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pacientes.csv"',
    },
  })
}

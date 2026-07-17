import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import type { SessionUser } from "@/types"

interface PatientRow {
  nombre: string
  apellido: string
  fechaNacimiento: string
  sexo: string
  telefono?: string
  email?: string
  numeroIdentificacion?: string
  tipoIdentificacion?: string
}

function parseCsv(text: string): PatientRow[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
  if (lines.length < 2) return []

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/^["﻿]+|["\s]+$/g, ""))

  const rows: PatientRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => { obj[h] = values[idx] ?? "" })

    const nombre = obj.nombre || obj["nombre(s)"] || ""
    const apellido = obj.apellido || obj.apellidos || ""
    const fechaNacimiento = obj.fechanacimiento || obj["fecha_nacimiento"] || obj["fecha nacimiento"] || ""
    const sexo = (obj.sexo || "").toUpperCase()

    if (!nombre || !apellido || !fechaNacimiento) continue

    rows.push({
      nombre,
      apellido,
      fechaNacimiento,
      sexo: sexo === "F" || sexo === "FEMENINO" ? "FEMENINO"
        : sexo === "M" || sexo === "MASCULINO" ? "MASCULINO"
        : "OTRO",
      telefono: obj.telefono || undefined,
      email: obj.email || undefined,
      numeroIdentificacion: obj.cedula || obj.numeroidenticacion || obj["numero_identificacion"] || undefined,
      tipoIdentificacion: undefined,
    })
  }

  return rows
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as SessionUser | undefined
  if (!user || (user.role !== "DOCTOR" && user.role !== "SECRETARY")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Archivo muy grande (máx 5 MB)" }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCsv(text)

  if (rows.length === 0) {
    return NextResponse.json({ error: "No se encontraron filas válidas en el CSV." }, { status: 400 })
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: "Máximo 500 pacientes por importación." }, { status: 400 })
  }

  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    try {
      const fechaNacimiento = new Date(row.fechaNacimiento)
      if (isNaN(fechaNacimiento.getTime())) {
        errors.push(`Fila inválida — fecha: ${row.nombre} ${row.apellido}`)
        skipped++
        continue
      }

      let patient = await db.patient.findFirst({
        where: {
          nombre: row.nombre,
          apellido: row.apellido,
          fechaNacimiento,
        },
      })

      if (!patient) {
        patient = await db.patient.create({
          data: {
            nombre: row.nombre,
            apellido: row.apellido,
            fechaNacimiento,
            sexo: row.sexo as "MASCULINO" | "FEMENINO" | "OTRO",
            telefono: row.telefono || null,
            email: row.email || null,
            numeroIdentificacion: row.numeroIdentificacion || null,
            tipoIdentificacion: row.numeroIdentificacion ? "CEDULA_V" : null,
            sinCedula: !row.numeroIdentificacion,
          },
        })
      }

      // Check for existing registration in this workspace
      const existingReg = await db.patientRegistration.findFirst({
        where: { patientId: patient.id, workspaceId: user.workspaceId },
      })

      if (existingReg) {
        skipped++
        continue
      }

      const count = await db.patientRegistration.count({
        where: { workspaceId: user.workspaceId },
      })
      const idDisplay = String(count + 1)

      await db.patientRegistration.create({
        data: {
          workspaceId: user.workspaceId,
          patientId: patient.id,
          idDisplay,
        },
      })

      created++
    } catch (e) {
      errors.push(`${row.nombre} ${row.apellido}: ${String(e)}`)
      skipped++
    }
  }

  return NextResponse.json({
    total: rows.length,
    created,
    skipped,
    errors: errors.slice(0, 20),
  })
}

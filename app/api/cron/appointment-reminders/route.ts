import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { sendAppointmentReminder } from "@/lib/email"
import { notifyAppointmentReminder } from "@/lib/whatsapp"
import { formatDoctorName } from "@/lib/doctor-utils"

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch all active workspaces with their reminder config
  const workspaces = await db.workspace.findMany({
    select: { id: true, recordatorioHoras: true, recordatorioWa: true, recordatorioEmail: true },
  })

  const appointments = await db.appointment.findMany({
    where: {
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    include: {
      patientRegistration: { include: { patient: true } },
      workspace: { include: { doctor: true } },
    },
  })

  const wsMap = new Map(workspaces.map((w) => [w.id, w]))

  let sent = 0
  const errors: string[] = []

  const now = new Date()

  for (const appt of appointments) {
    const pat = appt.patientRegistration?.patient
    if (!pat) continue

    const wsConfig = wsMap.get(appt.workspaceId)
    const horas = wsConfig?.recordatorioHoras ?? 24
    const sendEmail = wsConfig?.recordatorioEmail ?? true
    const sendWa = wsConfig?.recordatorioWa ?? false

    // Check if appointment is within the workspace's configured reminder window
    const diffMs = appt.fechaHora.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    if (diffHours < 0 || diffHours > horas + 1) continue

    const fechaHoraStr = format(appt.fechaHora, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
    const doctorName = formatDoctorName(appt.workspace.doctor)
    const patientName = `${pat.nombre} ${pat.apellido}`

    try {
      if (sendEmail && pat.email) {
        await sendAppointmentReminder({
          to: pat.email,
          patientName,
          fechaHora: fechaHoraStr,
          doctorName,
        })
        sent++
      }
      // WhatsApp temporalmente desactivado
      // if (sendWa && pat.telefono) {
      //   void notifyAppointmentReminder({
      //     phone: pat.telefono,
      //     patientName,
      //     doctorName,
      //     fechaHora: fechaHoraStr,
      //   })
      // }
    } catch (e) {
      errors.push(`${appt.id}: ${String(e)}`)
    }
  }

  return NextResponse.json({
    checked: appointments.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  })
}

export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createServerCaller } from "@/server/caller"
import { TeleconsultaRoom } from "./teleconsulta-room"

export default async function TeleconsultaPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { appointmentId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const caller = await createServerCaller()
  const appt = await (caller as any).appointment.get({ id: appointmentId }).catch(() => null)
  if (!appt) redirect("/doctor/appointments")
  if (appt.tipo !== "VIDEOCONSULTA") redirect("/doctor/appointments")

  const roomName = `medsysve-${appointmentId.slice(-10)}`

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 p-6">
      <TeleconsultaRoom
        appointmentId={appointmentId}
        roomName={roomName}
        patientName={
          appt.patientRegistration
            ? `${appt.patientRegistration.patient.nombre} ${appt.patientRegistration.patient.apellido}`
            : "Paciente"
        }
        fechaHora={appt.fechaHora}
      />
    </div>
  )
}

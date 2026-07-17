import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ScheduleClient } from "@/components/schedule/schedule-client"

export default async function SchedulePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "DOCTOR") {
    redirect("/login")
  }

  return (
    <div className="p-6 space-y-2">
      <h1 className="text-lg font-semibold text-white">Horario de atención</h1>
      <p className="text-sm text-slate-400 mb-4">
        Configure sus días y horas de atención para permitir que los pacientes soliciten citas desde
        el portal.
      </p>
      <ScheduleClient />
    </div>
  )
}

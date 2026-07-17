import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { SessionUser } from "@/types"
import { NurseDashboardClient } from "@/components/nurse/nurse-dashboard-client"

export default async function NurseDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser
  if (user.role !== "NURSE" && user.role !== "ASSISTANT" && user.role !== "DOCTOR" && user.role !== "SECRETARY") {
    redirect("/login")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Sala de espera</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Bienvenida, {user.nombre} — gestiona la llegada de pacientes de hoy.
        </p>
      </div>
      <NurseDashboardClient />
    </div>
  )
}

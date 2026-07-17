import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { SessionUser } from "@/types"
import { AssistantDashboardClient } from "@/components/assistant/assistant-dashboard-client"

export default async function AssistantDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser
  if (user.role !== "ASSISTANT" && user.role !== "DOCTOR") redirect("/login")

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Panel de Asistente</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Bienvenida, {user.nombre} — resumen del día.
        </p>
      </div>
      <AssistantDashboardClient />
    </div>
  )
}

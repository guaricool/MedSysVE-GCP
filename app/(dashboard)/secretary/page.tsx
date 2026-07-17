import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { SessionUser } from "@/types"
import { SecretaryDashboardClient } from "@/components/secretary/secretary-dashboard-client"

export default async function SecretaryDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser
  if (user.role !== "SECRETARY" && user.role !== "DOCTOR") redirect("/login")

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Panel de Secretaría</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Bienvenida, {user.nombre} — aquí tienes el resumen del día.
        </p>
      </div>
      <SecretaryDashboardClient />
    </div>
  )
}

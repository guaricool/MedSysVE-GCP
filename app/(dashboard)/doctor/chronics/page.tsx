import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { SessionUser } from "@/types"
import { ChronicsClient } from "@/components/dashboard/chronics-client"

export default async function ChronicsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser
  if (user.role !== "DOCTOR") redirect("/login")

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Panel de Crónicos</h1>
        <p className="text-sm text-slate-400">
          Seguimiento de pacientes con enfermedades crónicas — ordenados por nivel de riesgo
        </p>
      </div>
      <ChronicsClient />
    </div>
  )
}

export const dynamic = "force-dynamic"

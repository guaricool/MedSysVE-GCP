export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QualityClient } from "./quality-client"

export default async function QualityPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "DOCTOR") redirect("/doctor")

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Indicadores de Calidad</h1>
        <p className="mt-1 text-sm text-slate-400">
          Métricas de calidad asistencial de los últimos 30 días
        </p>
      </div>
      <QualityClient />
    </div>
  )
}

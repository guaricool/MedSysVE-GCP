import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AnalyticsClient } from "@/components/analytics/analytics-client"
import { Download } from "lucide-react"

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user || !["DOCTOR", "SECRETARY"].includes(session.user.role)) {
    redirect("/login")
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Estadísticas</h1>
          <p className="text-sm text-slate-400">Resumen de actividad del consultorio</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/patients"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Download size={12} />
            Pacientes CSV
          </a>
          <a
            href="/api/export/appointments"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Download size={12} />
            Citas CSV
          </a>
          <a
            href="/api/export/invoices"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Download size={12} />
            Facturas CSV
          </a>
        </div>
      </div>
      <AnalyticsClient />
    </div>
  )
}

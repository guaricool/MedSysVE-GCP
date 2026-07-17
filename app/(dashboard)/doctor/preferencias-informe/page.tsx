import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ReportPreferencesForm } from "@/components/reports/report-preferences-form"
import { FileText } from "lucide-react"
import type { SessionUser } from "@/types"

/**
 * Per-doctor customizable medical report preferences.
 *
 * Doctor visits /doctor/preferencias-informe once, picks which sections
 * appear in their informes (the AI-generated draft) and any standing
 * instructions per section. The report resolver in types/report.ts
 * applies these at informe time.
 *
 * Server component: redirects to /login if no session or wrong role.
 * The form itself is a client component (interactive checkboxes).
 */
export default async function PreferenciasInformePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/login")
  const user = session.user as SessionUser

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-blue-400">
          <FileText size={18} />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Informes
          </span>
        </div>
        <h1 className="text-lg font-semibold text-white">
          Preferencias del informe médico
        </h1>
        <p className="text-sm text-slate-400">
          Elegí qué secciones querés que la IA incluya en tus informes por
          default, y agregá instrucciones que la IA seguirá cada vez.
        </p>
      </div>

      <ReportPreferencesForm />
    </div>
  )
}

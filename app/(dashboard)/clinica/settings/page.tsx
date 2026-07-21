import { Settings } from "lucide-react"

export default function ClinicaSettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <Settings size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Configuración Institucional</h1>
            <p className="text-xs text-slate-400">Parámetros generales de la clínica, ubicación geográfica e identidad visual.</p>
          </div>
        </div>
        <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 border border-purple-500/20">
          Ajustes
        </span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <Settings className="mx-auto mb-3 h-12 w-12 text-slate-600" />
        <h2 className="text-base font-semibold text-slate-300">Configuración General de la Clínica</h2>
        <p className="mt-1 text-xs text-slate-500">
          Personalice la información del establecimiento, logotipo y membrete oficial de informes médicos.
        </p>
      </div>
    </div>
  )
}

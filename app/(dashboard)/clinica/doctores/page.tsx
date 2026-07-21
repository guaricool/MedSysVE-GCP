import { Users } from "lucide-react"

export default function ClinicaDoctoresPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Gestión de Doctores de la Clínica</h1>
            <p className="text-xs text-slate-400">Directorio y asignación de consultorios de la red médica.</p>
          </div>
        </div>
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
          Módulo Clínico
        </span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <Users className="mx-auto mb-3 h-12 w-12 text-slate-600" />
        <h2 className="text-base font-semibold text-slate-300">Directorio Médico en Configuración</h2>
        <p className="mt-1 text-xs text-slate-500">
          Este panel permite al Administrador de la Clínica vincular especialistas y gestionar afiliaciones institucionales.
        </p>
      </div>
    </div>
  )
}

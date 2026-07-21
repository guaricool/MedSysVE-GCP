import { ShieldCheck } from "lucide-react"

export default function ClinicaAuditPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Auditoría Institucional</h1>
            <p className="text-xs text-slate-400">Trazabilidad de accesos, registros de auditoría PHI y seguridad clínica.</p>
          </div>
        </div>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
          LOPDP / HIPAA
        </span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-slate-600" />
        <h2 className="text-base font-semibold text-slate-300">Registro de Eventos de Seguridad</h2>
        <p className="mt-1 text-xs text-slate-500">
          Bitácora inmutable de acciones administrativas y accesos a historias médicas dentro del centro clínico.
        </p>
      </div>
    </div>
  )
}

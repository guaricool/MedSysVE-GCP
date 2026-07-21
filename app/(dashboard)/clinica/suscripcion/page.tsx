import { DollarSign } from "lucide-react"

export default function ClinicaSuscripcionPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <DollarSign size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Suscripción y Plan Institucional</h1>
            <p className="text-xs text-slate-400">Gestión de licencias, facturación corporativa y métodos de pago.</p>
          </div>
        </div>
        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400 border border-green-500/20">
          Facturación SaaS
        </span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <DollarSign className="mx-auto mb-3 h-12 w-12 text-slate-600" />
        <h2 className="text-base font-semibold text-slate-300">Plan Institucional Activo</h2>
        <p className="mt-1 text-xs text-slate-500">
          Consulte los detalles de suscripción corporativa Stripe o renueve sus cupos de consultorios.
        </p>
      </div>
    </div>
  )
}

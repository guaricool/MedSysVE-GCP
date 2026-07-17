import { db } from "@/lib/db"
import { SendReminderButton } from "./send-reminder-button"
import Link from "next/link"

export const dynamic = "force-dynamic"
export default async function AdminDashboard() {
  const [
    totalClinics,
    totalDoctors,
    premiumDoctors,
    totalPatients,
    totalEncounters,
    doctorsInClinics,
    expiredSubscriptions,
  ] = await Promise.all([
    db.clinic.count(),
    db.doctor.count(),
    db.doctor.count({ where: { plan: "premium" } }),
    db.patient.count(),
    db.encounter.count(),
    db.doctor.count({
      where: { clinicAffiliations: { some: {} } },
    }),
    db.doctor.findMany({
      where: {
        plan: { notIn: ["free", "cortesia"] },
        stripeCurrentPeriodEnd: { lt: new Date() },
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        plan: true,
        stripeCurrentPeriodEnd: true,
      },
    }),
  ])

  const independentDoctors = totalDoctors - doctorsInClinics

  // Suposición de MRR (Ingreso Recurrente Mensual) basado en $25 por plan premium
  const estimatedMRR = premiumDoctors * 25

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Command Center</h2>
          <p className="text-slate-400 text-sm">Resumen Operativo y Financiero de MedSysVE</p>
        </div>
        <a 
          href="https://glitchtip.13.140.181.29.sslip.io/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 px-4 py-2 rounded-lg transition-colors text-sm font-semibold shadow-lg"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Monitoreo GlitchTip (Errores VPS)
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Clínicas Registradas" value={totalClinics} color="text-emerald-400" bg="bg-emerald-400/10" />
        <MetricCard label="Doctores en Clínica" value={doctorsInClinics} color="text-blue-400" bg="bg-blue-400/10" />
        <MetricCard label="Doctores Independientes" value={independentDoctors} color="text-cyan-400" bg="bg-cyan-400/10" />
        <MetricCard label="Total Pacientes" value={totalPatients} color="text-purple-400" bg="bg-purple-400/10" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Finanzas Generales</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Ingreso Recurrente Estimado (MRR)</p>
                <p className="text-4xl font-bold text-emerald-400">${estimatedMRR.toLocaleString()}<span className="text-lg text-emerald-400/50">/mes</span></p>
                <p className="text-xs text-slate-500 mt-2">Basado en {premiumDoctors} suscripciones Premium activas.</p>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-1">Informes Clínicos Generados</p>
                <p className="text-2xl font-bold text-white">{totalEncounters.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden h-full">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Suscripciones Vencidas / Por Cobrar ({expiredSubscriptions.length})
              </h3>
            </div>
            
            {expiredSubscriptions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No hay suscripciones vencidas en este momento.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wide bg-slate-950/50">
                    <th className="text-left px-4 py-3">Doctor</th>
                    <th className="text-left px-4 py-3">Vencimiento</th>
                    <th className="text-right px-4 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredSubscriptions.map((d) => (
                    <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{d.nombre} {d.apellido}</div>
                        <div className="text-xs text-slate-400">{d.email}</div>
                      </td>
                      <td className="px-4 py-3 text-rose-400 font-medium">
                        {d.stripeCurrentPeriodEnd ? new Date(d.stripeCurrentPeriodEnd).toLocaleDateString("es-VE") : "Desconocido"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <SendReminderButton doctorId={d.id} doctorName={`${d.nombre} ${d.apellido}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Link
          href="/admin/doctors"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 font-medium transition-colors"
        >
          Ver y gestionar todos los doctores →
        </Link>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color, bg }: { label: string, value: number, color: string, bg: string }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${bg}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { trpc } from "@/lib/trpc-client"
import { AlertTriangle, HeartPulse, Calendar, Search, ChevronDown, ChevronUp, Activity } from "lucide-react"
import { Input } from "@/components/ui/input"

const RISK_LABELS: Record<number, { label: string; cls: string }> = {
  0: { label: "Sin riesgo", cls: "bg-emerald-900/40 text-emerald-300 border-emerald-800" },
  1: { label: "Atención", cls: "bg-amber-900/40 text-amber-300 border-amber-800" },
  2: { label: "En riesgo", cls: "bg-red-900/40 text-red-300 border-red-800" },
  3: { label: "Alto riesgo", cls: "bg-red-900/60 text-red-200 border-red-700" },
  4: { label: "Crítico", cls: "bg-red-950 text-red-100 border-red-600" },
}

function riskBadge(score: number) {
  return RISK_LABELS[Math.min(score, 4)] ?? RISK_LABELS[4]
}

function daysBadge(days: number | null) {
  if (days === null) return { label: "Sin visitas", cls: "text-red-400" }
  if (days > 90) return { label: `${days} días sin visita`, cls: "text-red-400" }
  if (days > 60) return { label: `${days} días sin visita`, cls: "text-amber-400" }
  if (days > 30) return { label: `Hace ${days} días`, cls: "text-yellow-400" }
  return { label: `Hace ${days} días`, cls: "text-slate-400" }
}

export function ChronicsClient() {
  const { data, isLoading } = (trpc.analytics as any).chronics.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  const [search, setSearch] = useState("")
  const [filterAtRisk, setFilterAtRisk] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const patients = (data as any[] | undefined) ?? []

  const filtered = patients.filter((p: any) => {
    if (filterAtRisk && !p.atRisk) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.tags.some((t: any) => t.etiqueta.toLowerCase().includes(q))
      )
    }
    return true
  })

  const totalAtRisk = patients.filter((p: any) => p.atRisk).length
  const noAppt = patients.filter((p: any) => !p.nextAppointmentAt).length

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4 text-center">
          <p className="text-2xl font-bold text-rose-300">{patients.length}</p>
          <p className="mt-1 text-xs text-rose-500">Pacientes crónicos</p>
        </div>
        <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-4 text-center">
          <p className="text-2xl font-bold text-red-300">{totalAtRisk}</p>
          <p className="mt-1 text-xs text-red-500">En riesgo</p>
        </div>
        <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 text-center">
          <p className="text-2xl font-bold text-amber-300">{noAppt}</p>
          <p className="mt-1 text-xs text-amber-500">Sin próxima cita</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o diagnóstico..."
            className="bg-slate-800 border-slate-700 text-white pl-8"
          />
        </div>
        <button
          onClick={() => setFilterAtRisk(!filterAtRisk)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors ${
            filterAtRisk
              ? "border-red-700 bg-red-900/30 text-red-300"
              : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
          }`}
        >
          <AlertTriangle size={13} />
          Solo en riesgo
        </button>
      </div>

      {/* Patient list */}
      {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-10 text-center">
          <HeartPulse size={32} className="mx-auto mb-2 text-slate-700" />
          <p className="text-slate-500">
            {patients.length === 0
              ? "No hay pacientes con diagnósticos crónicos registrados."
              : "No hay resultados para la búsqueda actual."}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((p: any) => {
          const risk = riskBadge(p.riskScore)
          const days = daysBadge(p.daysSinceLastVisit)
          const isExpanded = expandedId === p.patientRegistrationId

          return (
            <div
              key={p.patientRegistrationId}
              className={`rounded-xl border transition-colors ${
                p.atRisk ? "border-red-800/40 bg-red-950/10" : "border-slate-800 bg-slate-900/50"
              }`}
            >
              {/* Header row */}
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.patientRegistrationId)}
                  className="mr-1 text-slate-500 hover:text-slate-300"
                >
                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.atRisk && <AlertTriangle size={13} className="shrink-0 text-red-400" />}
                    <Link
                      href={`/doctor/patients/${p.patientRegistrationId}`}
                      className="font-medium text-white hover:text-blue-300 transition-colors"
                    >
                      {p.nombre}
                    </Link>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${risk.cls}`}>
                      {risk.label}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.tags.map((t: any) => (
                      <span
                        key={t.etiqueta}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: `${t.color}22`, color: t.color, border: `1px solid ${t.color}44` }}
                      >
                        {t.etiqueta}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right text-xs shrink-0">
                  <p className={days.cls}>{days.label}</p>
                  {p.nextAppointmentAt ? (
                    <p className="mt-1 flex items-center gap-1 text-slate-400 justify-end">
                      <Calendar size={11} />
                      {new Date(p.nextAppointmentAt).toLocaleDateString("es-VE", {
                        day: "numeric",
                        month: "short",
                        timeZone: 'America/Caracas',
                      })}
                    </p>
                  ) : (
                    <p className="mt-1 text-amber-500">Sin próxima cita</p>
                  )}
                </div>
              </div>

              {/* Expanded vitals row */}
              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/30 px-4 py-3">
                  {p.vitales ? (
                    <div className="flex flex-wrap gap-4 text-xs">
                      <div>
                        <span className="text-slate-500">TA</span>{" "}
                        <span
                          className={
                            p.vitales.tas > 140
                              ? "font-semibold text-red-400"
                              : "text-slate-300"
                          }
                        >
                          {p.vitales.tas}/{p.vitales.tad} mmHg
                        </span>
                      </div>
                      {p.vitales.peso && (
                        <div>
                          <span className="text-slate-500">Peso</span>{" "}
                          <span className="text-slate-300">{p.vitales.peso} kg</span>
                        </div>
                      )}
                      {p.vitales.spo2 && (
                        <div>
                          <span className="text-slate-500">SpO₂</span>{" "}
                          <span
                            className={
                              p.vitales.spo2 < 93
                                ? "font-semibold text-red-400"
                                : "text-slate-300"
                            }
                          >
                            {p.vitales.spo2}%
                          </span>
                        </div>
                      )}
                      <span className="text-slate-600">
                        Última consulta:{" "}
                        {p.lastVisitAt
                          ? new Date(p.lastVisitAt).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })
                          : "—"}
                      </span>
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Activity size={12} />
                      Sin signos vitales registrados en consultas anteriores
                    </p>
                  )}
                  <Link
                    href={`/doctor/patients/${p.patientRegistrationId}`}
                    className="mt-2 inline-block text-xs text-blue-400 hover:underline"
                  >
                    Ver expediente completo →
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

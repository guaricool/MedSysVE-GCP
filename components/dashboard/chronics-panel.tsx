"use client"

import Link from "next/link"
import { trpc } from "@/lib/trpc-client"
import { AlertTriangle, HeartPulse, Calendar, Clock } from "lucide-react"

function daysBadge(days: number | null) {
  if (days === null) return { label: "Sin visitas", cls: "bg-red-900/40 text-red-300 border-red-800" }
  if (days > 90) return { label: `${days}d sin visita`, cls: "bg-red-900/40 text-red-300 border-red-800" }
  if (days > 60) return { label: `${days}d sin visita`, cls: "bg-amber-900/40 text-amber-300 border-amber-800" }
  return { label: `Hace ${days}d`, cls: "bg-slate-800 text-slate-400 border-slate-700" }
}

export function ChronicsPanel() {
  const { data, isLoading } = (trpc.analytics as any).chronics.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  const patients = (data as any[] | undefined) ?? []
  const atRisk = patients.filter((p) => p.atRisk)

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-sm text-slate-500">Cargando crónicos...</p>
      </div>
    )
  }

  if (patients.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <HeartPulse size={15} className="text-rose-400" />
          Seguimiento de Crónicos
          {atRisk.length > 0 && (
            <span className="ml-1 rounded-full bg-red-700 text-white text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center">
              {atRisk.length}
            </span>
          )}
        </h2>
        <Link href="/doctor/chronics" className="text-xs text-blue-400 hover:underline">
          Ver todos →
        </Link>
      </div>

      <ul className="space-y-2">
        {patients.slice(0, 5).map((p: any) => {
          const badge = daysBadge(p.daysSinceLastVisit)
          return (
            <li key={p.patientRegistrationId}>
              <Link
                href={`/doctor/patients/${p.patientRegistrationId}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 hover:bg-slate-800/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {p.atRisk && <AlertTriangle size={11} className="shrink-0 text-red-400" />}
                    <p className="text-sm font-medium text-white truncate">{p.nombre}</p>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((t: any) => (
                      <span
                        key={t.etiqueta}
                        className="rounded px-1 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: `${t.color}22`, color: t.color, border: `1px solid ${t.color}44` }}
                      >
                        {t.etiqueta}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {patients.length > 5 && (
        <p className="text-center text-xs text-slate-600">
          +{patients.length - 5} más en{" "}
          <Link href="/doctor/chronics" className="text-blue-400 hover:underline">
            ver panel completo
          </Link>
        </p>
      )}
    </div>
  )
}

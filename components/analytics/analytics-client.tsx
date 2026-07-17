"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { trpc } from "@/lib/trpc-client"

const GENDER_LABEL: Record<string, string> = {
  MASCULINO: "Masculino",
  FEMENINO: "Femenino",
  OTRO: "Otro",
}
const GENDER_COLOR: Record<string, string> = {
  MASCULINO: "#3b82f6",
  FEMENINO: "#ec4899",
  OTRO: "#8b5cf6",
}

export function AnalyticsClient() {
  const { data: summary, isLoading: loadingS } = trpc.analytics.summary.useQuery()
  const { data: citas } = trpc.analytics.citasPorSemana.useQuery()
  const { data: ingresos } = trpc.analytics.ingresosPorMes.useQuery()
  const { data: demographics } = trpc.analytics.demographics.useQuery()
  const { data: topDiagnoses = [] } = trpc.analytics.topDiagnoses.useQuery()
  const { data: retention } = trpc.analytics.retention.useQuery()

  if (loadingS) {
    return <div className="text-sm text-slate-400">Cargando estadísticas...</div>
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Pacientes" value={summary?.totalPatients ?? 0} unit="registrados" />
        <StatCard label="Citas este mes" value={summary?.citasThisMonth ?? 0} unit="citas" />
        <StatCard
          label="Cobrado (USD)"
          value={`$${(summary?.ingresosUsd ?? 0).toFixed(2)}`}
          unit="este mes"
          green
        />
        <StatCard
          label="Pendiente (USD)"
          value={`$${(summary?.pendienteUsd ?? 0).toFixed(2)}`}
          unit="por cobrar"
          yellow
        />
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">
            {retention ? `${retention.retentionPct}%` : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Activos (90d)</p>
          {retention && (
            <p className="text-xs text-slate-500 mt-0.5">
              {retention.activePatients}/{retention.totalPatients}
            </p>
          )}
        </div>
      </div>

      {/* Citas por semana */}
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Citas por semana (últimas 8 semanas)
        </h2>
        {citas && citas.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={citas} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="semana" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
                cursor={{ fill: "#1e293b" }}
              />
              <Bar dataKey="citas" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-500">Sin datos.</p>
        )}
      </section>

      {/* Ingresos por mes */}
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Ingresos USD por mes (últimos 6 meses)
        </h2>
        {ingresos && ingresos.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ingresos} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
                cursor={{ fill: "#1e293b" }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, "Ingresos"]}
              />
              <Bar dataKey="ingresos" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-500">Sin datos.</p>
        )}
      </section>

      {/* Top 10 diagnósticos */}
      {topDiagnoses.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Top 10 diagnósticos
          </h2>
          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            {topDiagnoses.map((d, i) => (
              <div key={d.codigo} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-right text-xs text-slate-500">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div
                    className="h-5 rounded-sm bg-indigo-600/40 flex items-center px-2"
                    style={{
                      width: `${Math.max(8, (d.count / (topDiagnoses[0]?.count ?? 1)) * 100)}%`,
                    }}
                  >
                    <span className="text-xs text-indigo-300 truncate">
                      {d.descripcion}{" "}
                      <span className="text-indigo-500 ml-1">({d.codigo})</span>
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-mono text-slate-400">{d.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Demographics */}
      {demographics && (
        <div className="grid gap-5 sm:grid-cols-3">
          {/* Age groups */}
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 sm:col-span-2">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Distribución por edad
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={demographics.ageGroups} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="rango" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
                  cursor={{ fill: "#1e293b" }}
                />
                <Bar dataKey="count" name="Pacientes" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* Gender */}
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Sexo biológico
            </h2>
            <ul className="space-y-3">
              {demographics.genderCounts.map((g: { sexo: string; count: number }) => {
                const total = demographics.genderCounts.reduce((s: number, x: { count: number }) => s + x.count, 0)
                const pct = total > 0 ? Math.round((g.count / total) * 100) : 0
                return (
                  <li key={g.sexo}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{GENDER_LABEL[g.sexo] ?? g.sexo}</span>
                      <span className="text-slate-400">{g.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: GENDER_COLOR[g.sexo] ?? "#64748b",
                        }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* New patients per month */}
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 sm:col-span-3">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Nuevos pacientes por mes (últimos 6 meses)
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={demographics.newPatientsPerMonth} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
                  cursor={{ fill: "#1e293b" }}
                />
                <Bar dataKey="nuevos" name="Nuevos" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  unit,
  green,
  yellow,
}: {
  label: string
  value: string | number
  unit: string
  green?: boolean
  yellow?: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${green ? "text-emerald-400" : yellow ? "text-yellow-400" : "text-white"}`}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500">{unit}</p>
    </div>
  )
}

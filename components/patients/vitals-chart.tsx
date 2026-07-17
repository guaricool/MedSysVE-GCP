"use client"
import { trpc } from "@/lib/trpc-client"
import { LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"
import { Info, TrendingUp, AlertTriangle } from "lucide-react"

interface Props { patientRegistrationId: string }

export function VitalsChart({ patientRegistrationId }: Props) {
  const { data: encountersRaw } = trpc.encounter.list.useQuery({ patientRegistrationId })
  const encounters = encountersRaw as any[] | undefined

  const points = (encounters ?? [])
    .filter((e: any) => e.vitales)
    .map((e) => {
      const v = e.vitales as Record<string, number | null>
      return {
        fecha: new Date(e.createdAt).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", timeZone: 'America/Caracas' }),
        pas: v.taSistolica ?? null,
        pad: v.taDiastolica ?? null,
        bpRange: (v.taSistolica && v.taDiastolica) ? [v.taDiastolica, v.taSistolica] : null,
        fc: v.fc ?? null,
        peso: v.peso ?? null,
        spo2: v.spo2 ?? null,
      }
    })
    .reverse()

  // Trend detection for blood pressure (last 3 points)
  const recentBp = points.filter((p) => p.pas !== null && p.pad !== null).slice(-3)
  const isTrendingUp = recentBp.length === 3 && recentBp[2].pas! > recentBp[1].pas! && recentBp[1].pas! > recentBp[0].pas!
  const hasHypertensionAlert = recentBp.length > 0 && recentBp[recentBp.length - 1].pas! > 140

  const hasBp = points.some((p) => p.pas !== null)
  const hasfc = points.some((p) => p.fc !== null)
  const hasPeso = points.some((p) => p.peso !== null)

  // Nothing recorded at all — explain why the chart is empty so the user
  // doesn't think it's broken.
  if (points.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-slate-800 bg-slate-900/30 p-3 text-xs text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0 text-slate-600" />
        <span>
          Aún no hay signos vitales registrados. Se llenarán automáticamente
          al guardar los signos vitales dentro de una consulta.
        </span>
      </div>
    )
  }

  // Only one encounter recorded — charts need at least 2 points for a
  // trend line, but show a useful summary of what we DO have.
  if (points.length < 2) {
    const only = points[0]
    return (
      <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
        <p className="text-xs text-slate-500">
          Una sola consulta con signos vitales registrados
          ({only.fecha}). Las tendencias se muestran a partir de la segunda.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {only.pas != null && (
            <div>
              <p className="text-slate-500">Presión arterial</p>
              <p className="font-mono text-slate-200">{only.pas}/{only.pad ?? "—"} mmHg</p>
            </div>
          )}
          {only.fc != null && (
            <div>
              <p className="text-slate-500">FC</p>
              <p className="font-mono text-slate-200">{only.fc} lpm</p>
            </div>
          )}
          {only.peso != null && (
            <div>
              <p className="text-slate-500">Peso</p>
              <p className="font-mono text-slate-200">{only.peso} kg</p>
            </div>
          )}
          {only.spo2 != null && (
            <div>
              <p className="text-slate-500">SpO₂</p>
              <p className="font-mono text-slate-200">{only.spo2}%</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!hasBp && !hasfc && !hasPeso) return null

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold text-slate-300">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === "bpRange") {
              return (
                <div key={index} className="flex items-center gap-2 text-xs text-blue-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  <span>PA: {entry.value[1]} / {entry.value[0]} mmHg</span>
                </div>
              )
            }
            if (entry.dataKey === "fc") {
              return (
                <div key={index} className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>FC: {entry.value} lpm</span>
                </div>
              )
            }
            if (entry.dataKey === "peso") {
              return (
                <div key={index} className="flex items-center gap-2 text-xs text-orange-400">
                  <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  <span>Peso: {entry.value} kg</span>
                </div>
              )
            }
            return null
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {(hasBp || hasfc) && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">Tendencia Cardiovascular</h3>
            {isTrendingUp && (
              <span className="flex items-center gap-1 rounded bg-amber-950/50 px-2 py-1 text-xs text-amber-400 border border-amber-900/50">
                <TrendingUp size={12} />
                Presión Sistólica al alza
              </span>
            )}
            {!isTrendingUp && hasHypertensionAlert && (
              <span className="flex items-center gap-1 rounded bg-red-950/50 px-2 py-1 text-xs text-red-400 border border-red-900/50">
                <AlertTriangle size={12} />
                Sistólica elevada ({'>'}140)
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#60a5fa" }} axisLine={false} tickLine={false} domain={['dataMin - 20', 'dataMax + 20']} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#34d399" }} axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {hasBp && <Bar yAxisId="left" dataKey="bpRange" name="Presión Arterial (Rango)" fill="#3b82f6" radius={[4, 4, 4, 4]} barSize={20} />}
              {hasfc && <Line yAxisId="right" type="monotone" dataKey="fc" name="Frecuencia Cardíaca" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#0f172a" }} connectNulls />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasPeso && (
        <div>
          <p className="text-xs text-slate-500 mb-2">Peso (kg)</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={points}>
              <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", fontSize: 11 }} />
              <Line type="monotone" dataKey="peso" name="Peso" stroke="#fb923c" dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

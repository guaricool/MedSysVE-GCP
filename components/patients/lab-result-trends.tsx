"use client"

import { useMemo } from "react"
import { trpc } from "@/lib/trpc-client"
import { Info, TrendingUp, AlertCircle, FileText } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts"

interface LabValue {
  parametro: string
  valor: string
  unidad?: string | null
  rangoReferencia?: string | null
  interpretado?: string | null
}

interface LabResult {
  id: string
  titulo: string
  fecha: string | Date
  resultado: string
  valores?: LabValue[] | null
}

interface TrendDataPoint {
  fechaStr: string
  fecha: Date
  valor: number
  rangoMin: number | null
  rangoMax: number | null
  interpretado: string | null
}

interface TrendSeries {
  parametro: string
  unidad: string | null
  rangoMin: number | null
  rangoMax: number | null
  data: TrendDataPoint[]
}

function extractTrends(results: LabResult[]): TrendSeries[] {
  const seriesMap: Record<string, TrendSeries> = {}

  for (const r of results) {
    if (!Array.isArray(r.valores)) continue

    for (const v of r.valores) {
      if (!v.parametro || !v.valor) continue

      const numValor = parseFloat(v.valor)
      if (isNaN(numValor)) continue // Only plot numeric values

      const paramKey = v.parametro.trim().toUpperCase()
      if (!seriesMap[paramKey]) {
        seriesMap[paramKey] = {
          parametro: v.parametro.trim(),
          unidad: v.unidad || null,
          rangoMin: null,
          rangoMax: null,
          data: [],
        }
      }

      let rangoMin = null
      let rangoMax = null
      if (v.rangoReferencia) {
        const m = v.rangoReferencia.match(/([\d.]+)\s*-\s*([\d.]+)/)
        if (m) {
          rangoMin = parseFloat(m[1])
          rangoMax = parseFloat(m[2])
        } else {
          const maxMatch = v.rangoReferencia.match(/<\s*([\d.]+)/)
          if (maxMatch) rangoMax = parseFloat(maxMatch[1])
        }
      }

      // Keep the most recent valid reference range as the global one for the background
      if (rangoMin !== null) seriesMap[paramKey].rangoMin = rangoMin
      if (rangoMax !== null) seriesMap[paramKey].rangoMax = rangoMax

      seriesMap[paramKey].data.push({
        fechaStr: new Date(r.fecha).toLocaleDateString("es-VE", {
          month: "short",
          day: "numeric",
          timeZone: "America/Caracas",
        }),
        fecha: new Date(r.fecha),
        valor: numValor,
        rangoMin,
        rangoMax,
        interpretado: v.interpretado || null,
      })
    }
  }

  // Filter only those with at least 2 numeric values, sort by date
  return Object.values(seriesMap)
    .filter((s) => s.data.length >= 2)
    .map((s) => {
      s.data.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      return s
    })
    .sort((a, b) => a.parametro.localeCompare(b.parametro))
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as TrendDataPoint
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl">
        <p className="text-xs font-semibold text-slate-300 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-400" />
          <span className="text-sm font-bold text-white">
            {data.valor}
          </span>
          {data.interpretado === "ALTO" && <span className="text-[10px] text-red-400 font-bold bg-red-400/10 px-1.5 py-0.5 rounded">ALTO</span>}
          {data.interpretado === "BAJO" && <span className="text-[10px] text-orange-400 font-bold bg-orange-400/10 px-1.5 py-0.5 rounded">BAJO</span>}
          {data.interpretado === "CRITICO" && <span className="text-[10px] text-red-500 font-bold bg-red-500/20 px-1.5 py-0.5 rounded">CRITICO</span>}
        </div>
        {(data.rangoMin !== null || data.rangoMax !== null) && (
          <p className="text-[10px] text-slate-500 mt-1">
            Ref: {data.rangoMin ?? 0} - {data.rangoMax ?? "∞"}
          </p>
        )}
      </div>
    )
  }
  return null
}

export function LabResultTrends({ patientRegistrationId }: { patientRegistrationId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawResults = [] } = (trpc as any).labResult.list.useQuery({ patientRegistrationId })
  const results = rawResults as LabResult[]

  const trends = useMemo(() => extractTrends(results), [results])

  // Unstructured / Timeline history
  const history = [...results].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  if (results.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-slate-800 bg-slate-900/30 p-3 text-xs text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0 text-slate-600" />
        <span>
          Aún no hay resultados de laboratorio cargados. Las tendencias se
          alimentan automáticamente al registrar resultados desde la sección
          <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">Resultados de Laboratorio</span>
          dentro de una consulta.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {trends.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Gráficas de Tendencias</h3>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {trends.map((series) => (
              <div key={series.parametro} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{series.parametro}</h4>
                    {series.unidad && <p className="text-[10px] text-slate-500">{series.unidad}</p>}
                  </div>
                  {(series.rangoMin !== null || series.rangoMax !== null) && (
                    <span className="text-[10px] text-slate-500 border border-slate-800 rounded bg-slate-800/50 px-2 py-1">
                      Ref: {series.rangoMin ?? 0} - {series.rangoMax ?? "∞"}
                    </span>
                  )}
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis
                        dataKey="fechaStr"
                        stroke="#64748b"
                        fontSize={10}
                        tickMargin={8}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(val) => typeof val === 'number' ? val.toFixed(1) : val}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#475569", strokeWidth: 1, strokeDasharray: "4 4" }} />
                      
                      {/* Reference Area Shading */}
                      {(series.rangoMin !== null || series.rangoMax !== null) && (
                        <ReferenceArea
                          y1={series.rangoMin ?? 0}
                          y2={series.rangoMax ?? 99999}
                          fill="#10b981"
                          fillOpacity={0.05}
                          strokeOpacity={0}
                        />
                      )}

                      <Line
                        type="monotone"
                        dataKey="valor"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#1e293b", stroke: "#60a5fa", strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: "#60a5fa", stroke: "#1e293b" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trends.length === 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-dashed border-amber-900/30 bg-amber-900/10 p-3 text-xs text-amber-500/80">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>No hay suficientes datos numéricos estructurados para generar gráficas de tendencia. (Se requieren al menos 2 mediciones del mismo parámetro).</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Historial Clínico de Laboratorios</h3>
        </div>
        <div className="relative pl-5 space-y-4">
          <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-800" />
          {history.map((r, idx) => (
            <div key={r.id} className="relative">
              <div
                className={`absolute -left-3.5 top-1.5 h-2.5 w-2.5 rounded-full border ${
                  idx === 0
                    ? "bg-slate-500 border-slate-400"
                    : "bg-slate-800 border-slate-600"
                }`}
                style={{ left: "-0.9rem" }}
              />
              <div className="bg-slate-900/40 border border-slate-800/60 rounded p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                  <p className="text-sm font-medium text-slate-200">{r.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.fecha).toLocaleDateString("es-VE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: 'America/Caracas',
                    })}
                  </p>
                </div>
                
                {r.valores && r.valores.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {r.valores.slice(0, 6).map((v, i) => (
                      <div key={i} className="rounded bg-slate-900 p-2 text-xs">
                        <p className="text-slate-500 truncate" title={v.parametro}>{v.parametro}</p>
                        <p className="font-medium text-slate-300">
                          {v.valor} <span className="text-[10px] text-slate-600">{v.unidad}</span>
                          {v.interpretado === "ALTO" && <span className="ml-1 text-red-400 font-bold">↑</span>}
                          {v.interpretado === "BAJO" && <span className="ml-1 text-orange-400 font-bold">↓</span>}
                        </p>
                      </div>
                    ))}
                    {r.valores.length > 6 && (
                      <div className="rounded bg-slate-900/50 p-2 text-xs flex items-center justify-center text-slate-500">
                        + {r.valores.length - 6} más
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-mono whitespace-pre-wrap line-clamp-3 mt-2">
                    {r.resultado.length > 220
                      ? r.resultado.slice(0, 220) + "..."
                      : r.resultado}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

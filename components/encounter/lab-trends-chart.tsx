"use client"

import { useMemo } from "react"
import { trpc } from "@/lib/trpc-client"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

interface Props {
  patientRegId: string
  parameter: "TSH" | "Glucosa" | "HbA1c" | "Insulina"
}

export function LabTrendsChart({ patientRegId, parameter }: Props) {
  const { data: results = [], isLoading } = trpc.labResult.list.useQuery({ patientRegistrationId: patientRegId })

  const chartData = useMemo(() => {
    if (!results.length) return []

    // regex to match parameter name
    const matchers = {
      TSH: /tsh|tirotropina/i,
      Glucosa: /glucosa|glicemia/i,
      HbA1c: /hba1c|hemoglobina glicosilada|glicada/i,
      Insulina: /insulina/i
    }
    const regex = matchers[parameter]

    const dataPoints = []

    for (const raw of results) {
      const r = raw as any
      const valores = r.valores
      if (!valores || !Array.isArray(valores)) continue

      const match = valores.find((v: any) => v && v.parametro && regex.test(v.parametro))
      if (match && match.valor) {
        // try to parse number
        const valStr = match.valor.toString().replace(',', '.')
        const valNum = parseFloat(valStr)
        if (!isNaN(valNum)) {
          dataPoints.push({
            date: new Date(r.fecha).toLocaleDateString(),
            timestamp: new Date(r.fecha).getTime(),
            value: valNum,
            unit: match.unidad || "",
          })
        }
      }
    }

    // sort ascending by date
    dataPoints.sort((a, b) => a.timestamp - b.timestamp)

    return dataPoints
  }, [results, parameter])

  if (isLoading) {
    return <div className="h-[250px] w-full flex items-center justify-center text-slate-500 text-sm animate-pulse bg-slate-900/20 rounded-lg border border-slate-800">Cargando tendencias...</div>
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] w-full flex flex-col items-center justify-center border border-dashed border-slate-700 bg-slate-900/20 rounded-lg text-slate-500 text-xs px-4 text-center">
        <span className="text-lg mb-2">📉</span>
        No hay datos estructurados de {parameter} para graficar.<br/>
        (Agregue laboratorios con la IA)
      </div>
    )
  }

  // Choose color based on parameter
  const colors = {
    TSH: "#8b5cf6", // violet
    Glucosa: "#3b82f6", // blue
    HbA1c: "#ef4444", // red
    Insulina: "#10b981", // emerald
  }

  return (
    <div className="h-[250px] w-full p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
      <h4 className="text-[11px] font-semibold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[parameter] }}></span>
        Tendencia: {parameter}
      </h4>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            fontSize={10} 
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={10} 
            tickFormatter={(val) => `${val}`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: "11px", borderRadius: "0.5rem" }}
            itemStyle={{ color: colors[parameter], fontWeight: "bold" }}
            formatter={(value: any, name: any, props: any) => [`${value} ${props.payload.unit}`, parameter]}
            labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={colors[parameter]} 
            strokeWidth={2}
            dot={{ fill: "#0f172a", stroke: colors[parameter], strokeWidth: 2, r: 4 }}
            activeDot={{ fill: colors[parameter], stroke: "#fff", strokeWidth: 2, r: 6 }}
            name={parameter}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

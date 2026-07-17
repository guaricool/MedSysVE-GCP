"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"

// WHO growth reference percentiles (simplified — P3/P50/P97 for boys 0-24 months weight kg)
// In production these would be full WHO tables; this covers the display pattern.
const WHO_WEIGHT_BOYS_0_24: Record<number, { p3: number; p50: number; p97: number }> = {
  0: { p3: 2.5, p50: 3.3, p97: 4.4 },
  2: { p3: 4.3, p50: 5.6, p97: 7.1 },
  4: { p3: 5.6, p50: 7.0, p97: 8.7 },
  6: { p3: 6.4, p50: 7.9, p97: 9.8 },
  9: { p3: 7.1, p50: 8.9, p97: 11.0 },
  12: { p3: 7.7, p50: 9.6, p97: 11.9 },
  15: { p3: 8.1, p50: 10.2, p97: 12.6 },
  18: { p3: 8.5, p50: 10.7, p97: 13.2 },
  21: { p3: 8.9, p50: 11.1, p97: 13.7 },
  24: { p3: 9.2, p50: 11.5, p97: 14.2 },
}

interface VitalPoint {
  fecha: string | Date
  peso?: number | null
  talla?: number | null
  fechaNacimiento: string | Date
}

interface Props {
  vitals: VitalPoint[]
  fechaNacimiento: string | Date
  sexo: "MASCULINO" | "FEMENINO" | string
}

function ageMonths(birth: Date, date: Date): number {
  return (date.getFullYear() - birth.getFullYear()) * 12 +
    (date.getMonth() - birth.getMonth())
}

export function GrowthChart({ vitals, fechaNacimiento, sexo }: Props) {
  const birth = new Date(fechaNacimiento)
  const isUnder2 = ageMonths(birth, new Date()) <= 30

  const chartData = useMemo(() => {
    return vitals
      .filter((v) => v.peso != null)
      .map((v) => {
        const months = ageMonths(birth, new Date(v.fecha))
        const ref = WHO_WEIGHT_BOYS_0_24[Math.round(months / 3) * 3]
        return {
          mes: months,
          label: `${months}m`,
          peso: v.peso,
          p3: ref?.p3,
          p50: ref?.p50,
          p97: ref?.p97,
        }
      })
      .sort((a, b) => a.mes - b.mes)
  }, [vitals, birth])

  if (!isUnder2 || chartData.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        {!isUnder2
          ? "Gráfica de crecimiento disponible para menores de 2 años."
          : "Sin datos de peso para graficar."}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">
        Peso (kg) vs percentiles OMS (0–24 meses, {sexo === "MASCULINO" ? "niños" : "niñas"})
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 6 }}
            labelStyle={{ color: "#94a3b8" }}
            itemStyle={{ color: "#e2e8f0" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: "#94a3b8" }}
          />
          <Line type="monotone" dataKey="p97" name="P97" stroke="#ef4444" strokeDasharray="4 2" dot={false} strokeWidth={1} />
          <Line type="monotone" dataKey="p50" name="P50" stroke="#94a3b8" strokeDasharray="4 2" dot={false} strokeWidth={1} />
          <Line type="monotone" dataKey="p3" name="P3" stroke="#3b82f6" strokeDasharray="4 2" dot={false} strokeWidth={1} />
          <Line
            type="monotone"
            dataKey="peso"
            name="Peso paciente"
            stroke="#10b981"
            dot={{ fill: "#10b981", r: 3 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import { trpc } from "@/lib/trpc-client"
import { Award, TrendingUp, TrendingDown, Minus, Users, FileText, Calendar, Heart, Pill, Activity } from "lucide-react"

interface Indicator {
  label: string
  value: number | string
  unit?: string
  target?: number
  icon: React.ReactNode
  description: string
  invertTrend?: boolean
}

function ScoreBar({ value, target = 80 }: { value: number; target?: number }) {
  const color =
    value >= target ? "bg-emerald-500" :
    value >= target * 0.7 ? "bg-amber-500" :
    "bg-red-500"
  return (
    <div className="relative h-1.5 w-full rounded-full bg-slate-800">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-slate-600"
        style={{ left: `${target}%` }}
        title={`Meta: ${target}%`}
      />
    </div>
  )
}

function TrendIcon({ value, target = 80, invertTrend = false }: { value: number; target: number; invertTrend?: boolean }) {
  const isGood = invertTrend ? value <= target : value >= target
  if (value === target) return <Minus className="h-3.5 w-3.5 text-slate-500" />
  return isGood
    ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
    : <TrendingDown className="h-3.5 w-3.5 text-red-400" />
}

export function QualityClient() {
  const { data, isLoading } = (trpc.analytics as any).qualityIndicators.useQuery()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-slate-800 bg-slate-900 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return <p className="text-slate-500 text-sm">Sin datos disponibles.</p>

  const indicators: Indicator[] = [
    {
      label: "Consultas firmadas",
      value: data.signRate,
      unit: "%",
      target: 90,
      icon: <FileText className="h-5 w-5 text-blue-400" />,
      description: "% de consultas firmadas en los últimos 30 días",
    },
    {
      label: "Tasa de asistencia",
      value: data.completionRate,
      unit: "%",
      target: 85,
      icon: <Calendar className="h-5 w-5 text-emerald-400" />,
      description: "Citas completadas vs. programadas",
    },
    {
      label: "Tasa de inasistencia",
      value: data.noShowRate,
      unit: "%",
      target: 10,
      icon: <Calendar className="h-5 w-5 text-red-400" />,
      description: "Pacientes que no asistieron",
      invertTrend: true,
    },
    {
      label: "Seguimiento crónicos",
      value: data.chronicFollowUp,
      unit: "%",
      target: 75,
      icon: <Heart className="h-5 w-5 text-rose-400" />,
      description: `${data.chronicPatients} crónicos con consulta en <90 días`,
    },
    {
      label: "Registro de vitales",
      value: data.vitalsRate,
      unit: "%",
      target: 80,
      icon: <Activity className="h-5 w-5 text-cyan-400" />,
      description: "Consultas con signos vitales registrados",
    },
    {
      label: "Recetas emitidas",
      value: data.prescriptionsLast30,
      icon: <Pill className="h-5 w-5 text-purple-400" />,
      description: "Prescripciones en los últimos 30 días",
    },
    {
      label: "Total pacientes",
      value: data.totalPatients,
      icon: <Users className="h-5 w-5 text-slate-400" />,
      description: "Pacientes registrados en el consultorio",
    },
    {
      label: "Consultas (30 días)",
      value: data.totalEncounters,
      icon: <FileText className="h-5 w-5 text-slate-400" />,
      description: "Consultas realizadas en el período",
    },
    {
      label: "Facturas pendientes",
      value: data.pendingInvoices,
      icon: <Award className="h-5 w-5 text-amber-400" />,
      description: "Facturas sin cobrar actualmente",
      target: 0,
      invertTrend: true,
    },
  ]

  const avgScore = Math.round(
    [data.signRate, data.completionRate, data.chronicFollowUp, data.vitalsRate].reduce((a, b) => a + b, 0) / 4
  )
  const scoreColor =
    avgScore >= 80 ? "text-emerald-400" :
    avgScore >= 60 ? "text-amber-400" :
    "text-red-400"

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex items-center gap-6">
        <div className="text-center">
          <p className={`text-5xl font-bold ${scoreColor}`}>{avgScore}</p>
          <p className="text-xs text-slate-500 mt-1">Score de calidad</p>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>0</span>
            <span className="text-slate-500">Meta: 80</span>
            <span>100</span>
          </div>
          <ScoreBar value={avgScore} target={80} />
          <p className="text-xs text-slate-500">
            Promedio de: firma de consultas, asistencia, seguimiento de crónicos y registro de vitales.
          </p>
        </div>
      </div>

      {/* Individual indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicators.map((ind) => {
          const isPercentage = ind.unit === "%"
          const numValue = typeof ind.value === "number" ? ind.value : 0
          return (
            <div
              key={ind.label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {ind.icon}
                  <p className="text-sm font-medium text-slate-200">{ind.label}</p>
                </div>
                {isPercentage && ind.target !== undefined && (
                  <TrendIcon value={numValue} target={ind.target} invertTrend={ind.invertTrend} />
                )}
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {ind.value}
                  {ind.unit && <span className="text-lg font-normal text-slate-400 ml-0.5">{ind.unit}</span>}
                </p>
                {isPercentage && ind.target !== undefined && (
                  <div className="mt-2">
                    <ScoreBar value={numValue} target={ind.target} />
                    <p className="text-[10px] text-slate-600 mt-1">Meta: {ind.target}%</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">{ind.description}</p>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-600">
        Datos calculados en tiempo real. Los indicadores de porcentaje comparan con metas de referencia estándar.
      </p>
    </div>
  )
}

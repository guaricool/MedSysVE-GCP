"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, CheckCircle } from "lucide-react"

interface Props {
  encounterId: string
  initialScales?: Array<{ tipo: string; puntuacion: number; valores: any }>
}

const WOMAC_QUESTIONS: Record<number, string> = {
  1: "Dolor al caminar en terreno plano",
  2: "Dolor al subir o bajar escaleras",
  3: "Dolor nocturno en la cama (durante el sueño)",
  4: "Dolor al estar de pie",
  5: "Dolor al estar sentado o acostado",
  6: "Rigidez al despertarse por la mañana",
  7: "Rigidez después de sentarse o acostarse",
  8: "Dificultad al bajar escaleras",
  9: "Dificultad al subir escaleras",
  10: "Dificultad al levantarse de una silla",
  11: "Dificultad al estar de pie",
  12: "Dificultad al agacharse/inclinarse hacia el suelo",
  13: "Dificultad al caminar en terreno plano",
  14: "Dificultad al entrar o salir de un carro",
  15: "Dificultad al ir de compras",
  16: "Dificultad al ponerse los calcetines/medias",
  17: "Dificultad al levantarse de la cama",
  18: "Dificultad al quitarse los calcetines/medias",
  19: "Dificultad al acostarse en la cama",
  20: "Dificultad al entrar o salir de la ducha/bañera",
  21: "Dificultad al estar sentado",
  22: "Dificultad al sentarse o levantarse del inodoro",
  23: "Dificultad al realizar tareas domésticas pesadas",
  24: "Dificultad al realizar tareas domésticas ligeras",
}

const DASH_QUESTIONS: Record<number, string> = {
  1: "Abrir un frasco nuevo o muy apretado",
  2: "Realizar tareas domésticas pesadas (lavar pisos, etc.)",
  3: "Llevar una bolsa de compras o maletín pesado",
  4: "Lavarse la espalda",
  5: "Cortar comida usando un cuchillo",
  6: "Actividades recreativas con fuerza/impacto (tenis, martillar)",
  7: "Limitación para actividades sociales con familia/amigos",
  8: "Limitación en el trabajo u otras actividades diarias",
  9: "Severidad del dolor en el brazo, hombro o mano",
  10: "Hormigueo o adormecimiento en extremidad superior",
  11: "Dificultad para dormir debido al dolor de extremidad",
}

export function EscalasTrauma({ encounterId, initialScales = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"WOMAC" | "QUICKDASH">("WOMAC")
  const [saved, setSaved] = useState(false)
  const utils = trpc.useUtils()

  const [womacAnswers, setWomacAnswers] = useState<Record<number, number>>(() => {
    const existing = initialScales.find((s) => s.tipo === "WOMAC")
    if (existing && typeof existing.valores === "object" && existing.valores) {
      return existing.valores as Record<number, number>
    }
    const initial: Record<number, number> = {}
    for (let i = 1; i <= 24; i++) initial[i] = 0
    return initial
  })

  const [dashAnswers, setDashAnswers] = useState<Record<number, number>>(() => {
    const existing = initialScales.find((s) => s.tipo === "QUICKDASH")
    if (existing && typeof existing.valores === "object" && existing.valores) {
      return existing.valores as Record<number, number>
    }
    const initial: Record<number, number> = {}
    for (let i = 1; i <= 11; i++) initial[i] = 1
    return initial
  })

  const saveScale = (trpc.encounter as any).saveScale.useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
    onError: (e: any) => alert(e.message),
  })

  const womacScore = Object.values(womacAnswers).reduce((acc, val) => acc + (val || 0), 0)

  const dashSum = Object.values(dashAnswers).reduce((acc, val) => acc + (val || 0), 0)
  const dashScore = parseFloat((((dashSum / 11) - 1) * 25).toFixed(1))

  function handleSaveWomac() {
    saveScale.mutate({
      encounterId,
      tipo: "WOMAC",
      valores: womacAnswers,
      puntuacion: womacScore,
    })
  }

  function handleSaveDash() {
    saveScale.mutate({
      encounterId,
      tipo: "QUICKDASH",
      valores: dashAnswers,
      puntuacion: dashScore,
    })
  }

  const womacSections = [
    { title: "Dolor (Items 1-5)", start: 1, end: 5 },
    { title: "Rigidez (Items 6-7)", start: 6, end: 7 },
    { title: "Capacidad Física / Dificultad (Items 8-24)", start: 8, end: 24 },
  ]

  const womacOptions = ["Ninguno (0)", "Leve (1)", "Moderado (2)", "Severo (3)", "Extremo (4)"]
  const dashOptions = ["Sin dificultad (1)", "Dificultad leve (2)", "Dificultad moderada (3)", "Dificultad severa (4)", "Incapaz (5)"]

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <Activity className="h-4 w-4 text-blue-400" />
          Escalas de Evaluación Ortopédica (SVCOT)
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("WOMAC")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === "WOMAC" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Escala WOMAC
          </button>
          <button
            onClick={() => setActiveTab("QUICKDASH")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === "QUICKDASH" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            QuickDASH
          </button>
        </div>
      </div>

      {activeTab === "WOMAC" && (
        <div className="space-y-4">
          <div className="rounded bg-slate-800/40 p-3 text-xs text-slate-300 flex items-center justify-between">
            <p>
              **WOMAC**: Evalúa dolor, rigidez y capacidad física en cadera o rodilla.
              Puntuación de 0 a 96 (Valores mayores indican peor estado articular).
            </p>
            <span className="text-sm font-bold text-blue-400 shrink-0 ml-4">Score: {womacScore}/96</span>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {womacSections.map((sec) => (
              <div key={sec.title} className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-l-2 border-blue-500 pl-2">
                  {sec.title}
                </h4>
                <div className="space-y-1.5">
                  {Array.from({ length: sec.end - sec.start + 1 }).map((_, idx) => {
                    const qId = sec.start + idx
                    return (
                      <div key={qId} className="flex flex-col sm:flex-row sm:items-center justify-between rounded bg-slate-800/20 p-2 text-xs border border-slate-800/50 gap-2">
                        <span className="text-slate-300 font-medium">{qId}. {WOMAC_QUESTIONS[qId]}</span>
                        <div className="flex flex-wrap gap-1 mt-1 sm:mt-0 shrink-0">
                          {womacOptions.map((opt, val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setWomacAnswers((prev) => ({ ...prev, [qId]: val }))}
                              className={`rounded px-2 py-0.5 text-[10px] border transition-colors ${
                                womacAnswers[qId] === val
                                  ? "bg-blue-600 border-blue-500 text-white font-medium"
                                  : "border-slate-800 bg-slate-900 text-slate-500 hover:text-white"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveWomac}
              disabled={saveScale.isPending}
              className="rounded bg-blue-700 px-4 py-1.5 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {saveScale.isPending ? "Guardando..." : "Guardar Escala WOMAC"}
            </button>
            {saved && (
              <p className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" /> Guardado.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "QUICKDASH" && (
        <div className="space-y-4">
          <div className="rounded bg-slate-800/40 p-3 text-xs text-slate-300 flex items-center justify-between">
            <p>
              **QuickDASH**: Evalúa síntomas y discapacidad física en extremidades superiores.
              Puntuación de 0 a 100 (0 = sin discapacidad, 100 = discapacidad máxima).
            </p>
            <span className="text-sm font-bold text-blue-400 shrink-0 ml-4">Score: {dashScore}/100</span>
          </div>

          <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
            {Array.from({ length: 11 }).map((_, idx) => {
              const qId = idx + 1
              return (
                <div key={qId} className="flex flex-col sm:flex-row sm:items-center justify-between rounded bg-slate-800/20 p-2 text-xs border border-slate-800/50 gap-2">
                  <span className="text-slate-300 font-medium">{qId}. {DASH_QUESTIONS[qId]}</span>
                  <div className="flex flex-wrap gap-1 mt-1 sm:mt-0 shrink-0">
                    {dashOptions.map((opt, valIdx) => {
                      const val = valIdx + 1
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setDashAnswers((prev) => ({ ...prev, [qId]: val }))}
                          className={`rounded px-2 py-0.5 text-[10px] border transition-colors ${
                            dashAnswers[qId] === val
                              ? "bg-blue-600 border-blue-500 text-white font-medium"
                              : "border-slate-800 bg-slate-900 text-slate-500 hover:text-white"
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDash}
              disabled={saveScale.isPending}
              className="rounded bg-blue-700 px-4 py-1.5 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {saveScale.isPending ? "Guardando..." : "Guardar QuickDASH"}
            </button>
            {saved && (
              <p className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" /> Guardado.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

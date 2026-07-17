"use client"

import { useState, useEffect, useRef } from "react"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Sparkles, ClipboardList, Stethoscope, Loader2, AlertCircle } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

/**
 * Plan de tratamiento (no farmacológico).
 *
 * Antes del 2026-07-11, este formulario vivía mezclado dentro de
 * `plan-form-integrado.tsx` junto con la sección de medicamentos. El
 * refactor los separó en dos cards visuales distintos (este y
 * `receta-form.tsx`) porque son dos responsabilidades diferentes:
 *   - **Plan de tratamiento**: instrucciones no farmacológicas que el
 *     doctor le da al paciente (controles, estudios, recomendaciones,
 *     señales de alarma). Va al expediente y al informe médico.
 *   - **Receta**: source-of-truth de los medicamentos, va al PDF de receta.
 *
 * Funcionalidades:
 *   - 2 textareas: "Plan (indicaciones)" + "Recomendaciones generales".
 *     Autosave con debounce 1.5s contra `encounter.update` (campo `plan`,
 *     delimitado por "--- Recomendaciones ---" para backwards compat).
 *   - Botón "✨ Generar plan con IA" que llama al endpoint
 *     `/api/ai/plan-suggestion` con el encounterId. La IA analiza el
 *     SOAP y propone: indicaciones, recomendaciones, alarmas, estudios,
 *     interconsultas. El doctor edita sobre el draft.
 *   - Re-generable: el doctor puede apretar el botón de nuevo si quiere
 *     un plan distinto.
 */

interface Props {
  encounterId: string
  disabled: boolean
  initialPlan?: string
  initialRecomendaciones?: string
}

interface PlanSuggestion {
  planIndicaciones?: string
  recomendaciones?: string
  alarmas?: string
  estudios?: string[]
  interconsultas?: string[]
  noData?: boolean
  parseFailed?: boolean
}

export function PlanTratamientoForm({
  encounterId,
  disabled,
  initialPlan,
  initialRecomendaciones,
}: Props) {
  const [plan, setPlan] = useState(initialPlan ?? "")
  const [recomendaciones, setRecomendaciones] = useState(initialRecomendaciones ?? "")
  const [savedPlan, setSavedPlan] = useState(false)
  const [savedRec, setSavedRec] = useState(false)

  useEffect(() => {
    if (initialPlan !== undefined) {
      setPlan(initialPlan)
    }
  }, [initialPlan])

  useEffect(() => {
    if (initialRecomendaciones !== undefined) {
      setRecomendaciones(initialRecomendaciones)
    }
  }, [initialRecomendaciones])
  const [aiSuggestion, setAiSuggestion] = useState<PlanSuggestion | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const timerPlan = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRec = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { setDirty } = useUnsaved()

  const utils = trpc.useUtils()

  const { data: enc } = trpc.encounter.get.useQuery({ id: encounterId })

  // tsc TS2589 workaround (audit S9, S10): see vitals-form.tsx for context.
  // next build's incremental tsc trips TS2589 here even though plain
  // `tsc --noEmit` does not.
  const updatePlan = (trpc.encounter.update.useMutation as any)({
    onSuccess: () => {
      setSavedPlan(true)
      setSavedRec(true)
      setDirty("plan-tratamiento", false)
      setTimeout(() => {
        setSavedPlan(false)
        setSavedRec(false)
      }, 2000)
      // Audit S9 (2026-07-07): refetch so the next save picks up the new
      // version (instead of reusing the stale one and getting a CONFLICT).
      utils.encounter.get.invalidate({ id: encounterId })
    },
  })

  function schedulePlan(value: string) {
    if (timerPlan.current) clearTimeout(timerPlan.current)
    setSavedPlan(false)
    setDirty("plan-tratamiento", true)
    timerPlan.current = setTimeout(() => {
      updatePlan.mutate({
        id: encounterId,
        plan: [value, recomendaciones].filter(Boolean).join("\n\n--- Recomendaciones ---\n\n") || undefined,
        ...(typeof enc?.version === "number" ? { version: enc.version } : {}),
      })
    }, 1500)
  }

  function scheduleRec(value: string) {
    if (timerRec.current) clearTimeout(timerRec.current)
    setSavedRec(false)
    setDirty("plan-tratamiento", true)
    timerRec.current = setTimeout(() => {
      updatePlan.mutate({
        id: encounterId,
        plan: [plan, value].filter(Boolean).join("\n\n--- Recomendaciones ---\n\n") || undefined,
        ...(typeof enc?.version === "number" ? { version: enc.version } : {}),
      })
    }, 1500)
  }

  useEffect(
    () => () => {
      if (timerPlan.current) clearTimeout(timerPlan.current)
      if (timerRec.current) clearTimeout(timerRec.current)
    },
    [],
  )

  async function generatePlan() {
    setAiLoading(true)
    setAiError(null)
    setAiSuggestion(null)
    try {
      const res = await fetch("/api/ai/plan-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encounterId }),
      })
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(errBody.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as PlanSuggestion
      setAiSuggestion(data)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Error desconocido")
    }
    setAiLoading(false)
  }

  function applySuggestion(target: "plan" | "recomendaciones" | "all") {
    if (!aiSuggestion) return
    if (target === "plan" || target === "all") {
      // Build the plan text from the suggestion: indicaciones + alarmas + estudios
      const parts: string[] = []
      if (aiSuggestion.planIndicaciones) parts.push(aiSuggestion.planIndicaciones)
      if (aiSuggestion.alarmas) {
        parts.push("")
        parts.push("Señales de alarma:")
        parts.push(aiSuggestion.alarmas)
      }
      if (aiSuggestion.estudios && aiSuggestion.estudios.length > 0) {
        parts.push("")
        parts.push("Estudios a solicitar:")
        aiSuggestion.estudios.forEach((e) => parts.push(`• ${e}`))
      }
      if (aiSuggestion.interconsultas && aiSuggestion.interconsultas.length > 0) {
        parts.push("")
        parts.push("Interconsultas:")
        aiSuggestion.interconsultas.forEach((i) => parts.push(`• ${i}`))
      }
      const next = parts.join("\n").trim()
      if (next) {
        setPlan(next)
        schedulePlan(next)
      }
    }
    if (target === "recomendaciones" || target === "all") {
      if (aiSuggestion.recomendaciones) {
        setRecomendaciones(aiSuggestion.recomendaciones)
        scheduleRec(aiSuggestion.recomendaciones)
      }
    }
    setAiSuggestion(null)
  }

  if (disabled) {
    return (
      <div className="space-y-4">
        {plan && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <ClipboardList size={12} />
              Plan (indicaciones, próximos pasos, seguimiento)
            </div>
            <p className="whitespace-pre-wrap text-sm text-slate-300">{plan}</p>
          </div>
        )}

        {recomendaciones && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Stethoscope size={12} />
              Recomendaciones generales
            </div>
            <p className="whitespace-pre-wrap text-sm text-slate-300">
              {recomendaciones}
            </p>
          </div>
        )}

        {!plan && !recomendaciones && (
          <p className="text-sm text-slate-500 italic">Sin plan de tratamiento registrado.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ─── AI plan generator ─── */}
      <div className="rounded-lg border border-purple-800/40 bg-purple-950/20 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-purple-200">
              ✨ Asistente IA — Plan de tratamiento
            </p>
            <p className="mt-0.5 text-xs text-purple-300/70">
              Sugiere indicaciones, señales de alarma, estudios e interconsultas
              a partir del motivo, historia clínica, examen físico y diagnósticos.
            </p>
          </div>
          <Button
            size="sm"
            disabled={aiLoading}
            onClick={generatePlan}
            className="shrink-0 bg-purple-600 hover:bg-purple-700"
          >
            {aiLoading ? (
              <>
                <Loader2 size={13} className="mr-1.5 animate-spin" />
                Analizando…
              </>
            ) : (
              <>
                <Sparkles size={13} className="mr-1.5" />
                {aiSuggestion ? "Re-generar" : "Generar plan"}
              </>
            )}
          </Button>
        </div>

        {aiError && (
          <div className="mt-2 flex items-start gap-2 rounded border border-red-800 bg-red-950/30 p-2 text-xs text-red-300">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {aiSuggestion && !aiSuggestion.noData && (
          <div className="mt-3 space-y-2 rounded-md border border-purple-700/50 bg-slate-950/50 p-3 text-xs">
            {aiSuggestion.planIndicaciones && (
              <div>
                <p className="font-medium text-purple-200">Indicaciones:</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-300">
                  {aiSuggestion.planIndicaciones}
                </p>
              </div>
            )}
            {aiSuggestion.recomendaciones && (
              <div>
                <p className="font-medium text-purple-200">Recomendaciones:</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-300">
                  {aiSuggestion.recomendaciones}
                </p>
              </div>
            )}
            {aiSuggestion.alarmas && (
              <div>
                <p className="font-medium text-purple-200">Señales de alarma:</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-300">{aiSuggestion.alarmas}</p>
              </div>
            )}
            {aiSuggestion.estudios && aiSuggestion.estudios.length > 0 && (
              <div>
                <p className="font-medium text-purple-200">Estudios:</p>
                <ul className="mt-1 list-disc pl-4 text-slate-300">
                  {aiSuggestion.estudios.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiSuggestion.interconsultas && aiSuggestion.interconsultas.length > 0 && (
              <div>
                <p className="font-medium text-purple-200">Interconsultas:</p>
                <ul className="mt-1 list-disc pl-4 text-slate-300">
                  {aiSuggestion.interconsultas.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiSuggestion.parseFailed && (
              <p className="text-yellow-300">
                La IA devolvió texto libre (no JSON). Aplicá el contenido manualmente.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-purple-800/30 pt-2">
              <span className="text-[10px] text-slate-400">Aplicar a:</span>
              {aiSuggestion.planIndicaciones && (
                <button
                  onClick={() => applySuggestion("plan")}
                  className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                >
                  Solo plan
                </button>
              )}
              {aiSuggestion.recomendaciones && (
                <button
                  onClick={() => applySuggestion("recomendaciones")}
                  className="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                >
                  Solo recomendaciones
                </button>
              )}
              {(aiSuggestion.planIndicaciones || aiSuggestion.alarmas) && aiSuggestion.recomendaciones && (
                <button
                  onClick={() => applySuggestion("all")}
                  className="rounded border border-purple-700 bg-purple-900/40 px-2 py-0.5 text-[10px] font-medium text-purple-200 hover:bg-purple-900/60"
                >
                  Todo (plan + recomendaciones)
                </button>
              )}
              <button
                onClick={() => setAiSuggestion(null)}
                className="ml-auto rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:bg-slate-800"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {aiSuggestion?.noData && (
          <p className="mt-2 text-xs text-yellow-300">
            No hay datos clínicos en la consulta. La IA no puede generar un plan sin motivo, historia clínica o diagnósticos.
          </p>
        )}
      </div>

      {/* ─── Plan (texto libre) ─── */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <ClipboardList size={12} />
          Plan (indicaciones, próximos pasos, seguimiento)
        </div>
        <textarea
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value)
            schedulePlan(e.target.value)
          }}
          rows={6}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
          placeholder="Ej: Control en 7 días. Si no mejora, considerar Rayos X de tórax. Suspender actividad física por 2 semanas..."
        />
        <p className="mt-1 text-xs text-slate-600">
          {updatePlan.isPending
            ? "Guardando..."
            : savedPlan
              ? "✓ Guardado"
              : "Guardado automático"}
        </p>
      </div>

      {/* ─── Recomendaciones generales ─── */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Stethoscope size={12} />
          Recomendaciones generales
        </div>
        <textarea
          value={recomendaciones}
          onChange={(e) => {
            setRecomendaciones(e.target.value)
            scheduleRec(e.target.value)
          }}
          rows={4}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
          placeholder="Ej: Dieta baja en sodio. Caminar 30 min al día. Tomar 2 litros de agua..."
        />
        <p className="mt-1 text-xs text-slate-600">
          {updatePlan.isPending
            ? "Guardando..."
            : savedRec
              ? "✓ Guardado"
              : "Guardado automático"}
        </p>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Sparkles, ChevronRight, X, Clock } from "lucide-react"

/**
 * Express mode — copy vitals, exam, historiaClinica, plan, and prescription
 * from the patient's most recent encounter, with one click.
 *
 * Why: most patient visits are follow-ups where 80% of the data is
 * the same as last time. Manually re-entering it is wasted effort.
 *
 * Flow:
 *   1. Show banner if a previous encounter exists for this patient.
 *   2. User clicks "Aplicar" → we copy the data to the current encounter.
 *   3. Banner disappears, doctor refines what's changed.
 *
 * Doctor can dismiss the banner if the visit is unrelated.
 */
export function ExpressModeBanner({
  patientRegId,
  show,
  onShow,
  onApply,
}: {
  patientRegId: string
  show: boolean
  onShow: (v: boolean) => void
  onApply: () => void
}) {
  const utils = trpc.useUtils()
  const apply = trpc.encounter.copyFromLast.useMutation({
    onSuccess: () => {
      onApply()
      onShow(false)
      utils.encounter.get.invalidate()
    },
  })

  // We need to query the last encounter — but encounters list isn't directly
  // exposed. Use the encounter.get of the new one, then fetch the last via
  // patient history. For simplicity, use a separate query.
  const { data: history } = (trpc as any).patient.history.useQuery(
    { patientRegistrationId: patientRegId, limit: 5 },
    { enabled: show },
  )

  const lastEncounter = (history as any[])?.[0]

  if (!show) {
    return (
      <div className="mx-auto mt-3 max-w-5xl px-4">
        <button
          onClick={() => onShow(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-purple-700/50 bg-purple-950/20 px-4 py-2 text-sm text-purple-300 transition-colors hover:bg-purple-950/40"
        >
          <Sparkles size={14} />
          ¿Es una consulta de seguimiento? <strong>Aplicar datos de la última consulta</strong>
          <ChevronRight size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto mt-3 max-w-5xl px-4">
      <div className="rounded-lg border border-purple-700/50 bg-purple-950/30 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-purple-200">
            <Sparkles size={14} />
            Modo Express — copiar datos de la última consulta
          </p>
          <button
            onClick={() => onShow(false)}
            className="text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {!lastEncounter ? (
          <p className="text-xs text-slate-400">
            No hay consultas previas para este paciente. Complete manualmente.
          </p>
        ) : (
          <>
            <div className="mb-3 rounded border border-purple-800/50 bg-purple-900/20 p-2 text-xs">
              <p className="text-purple-200">
                <strong>Última consulta:</strong>{" "}
                {new Date(lastEncounter.createdAt).toLocaleDateString("es-VE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "America/Caracas",
                })}
              </p>
              {lastEncounter.motivo && (
                <p className="text-purple-300/80">Motivo: {lastEncounter.motivo}</p>
              )}
              {lastEncounter.diagnoses?.length > 0 && (
                <p className="text-purple-300/80">
                  Diagnósticos: {lastEncounter.diagnoses.map((d: any) => d.descripcion).join(", ")}
                </p>
              )}
              <p className="text-xs text-blue-200 mt-1">
                Se copiarán: motivo, historia clínica, signos vitales, examen físico, plan, receta.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => onShow(false)}
                className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => apply.mutate({ fromEncounterId: lastEncounter.id, toEncounterId: lastEncounter.id /* see router */ })}
                disabled={apply.isPending}
                className="flex items-center gap-1 rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                <Sparkles size={12} />
                {apply.isPending ? "Aplicando..." : "Aplicar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
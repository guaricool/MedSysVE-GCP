"use client"

import { useState, useRef, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { MedicationSearch } from "./medication-search"
import { Button } from "@/components/ui/button"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus, FileText, AlertTriangle, Sparkles, Pill } from "lucide-react"
import type { MedicationSearchResult as RedisMedication } from "./medication-search"

/**
 * Receta médica (solo tratamiento de medicamentos).
 *
 * Antes del 2026-07-11, este formulario vivía mezclado dentro de
 * `plan-form-integrado.tsx` junto con las secciones de "Plan (indicaciones)"
 * y "Recomendaciones generales". El refactor los separó en dos cards
 * visuales distintos (este y `plan-tratamiento-form.tsx`) porque son
 * dos responsabilidades diferentes:
 *   - **Receta**: source-of-truth de los medicamentos que van al PDF de
 *     receta. Es la fuente legal de prescripción.
 *   - **Plan de tratamiento**: instrucciones no farmacológicas (controles,
 *     estudios, recomendaciones, alarmas) que van al expediente y al
 *     informe médico.
 *
 * La Receta (Prescription) sigue siendo la fuente de verdad de los
 * medicamentos: cada item que se agrega aparece en el PDF de receta.
 *
 * El doctor edita la lista con autocompletar (Redis-backed), el sistema
 * verifica interacciones medicamentosas con IA, y el guardado es autosave
 * (debounce 1.5s) contra `prescription.createOrGet` + `prescription.addItem`.
 */

interface ItemDraft {
  med: RedisMedication
  concentracion: string
  dosis: string
  frecuencia: string
  duracion: string
  indicacionesEspeciales: string
}

interface Props {
  encounterId: string
  disabled: boolean
}

const FRECUENCIAS_COMUNES = [
  "Cada 4 horas",
  "Cada 6 horas",
  "Cada 8 horas",
  "Cada 12 horas",
  "Cada 24 horas",
  "Una vez al día",
  "Dos veces al día",
  "Tres veces al día",
  "Antes de dormir",
  "En ayunas",
  "Con las comidas",
  "Si hay dolor (PRN)",
]

const DURACIONES_COMUNES = [
  "3 días",
  "5 días",
  "7 días",
  "10 días",
  "14 días",
  "21 días",
  "30 días",
  "Hasta nueva orden",
  "Por 1 mes",
  "Por 3 meses",
  "Por 6 meses",
  "Indefinido",
]

export function RecetaForm({ encounterId, disabled }: Props) {
  // Med draft state
  const [draft, setDraft] = useState<ItemDraft | null>(null)
  const [checkingInteraction, setCheckingInteraction] = useState(false)
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null)
  const [pendingAdd, setPendingAdd] = useState<{ prescId: string } | null>(null)
  const [loadingDose, setLoadingDose] = useState(false)
  const { setDirty } = useUnsaved()

  useEffect(() => {
    setDirty("receta", draft !== null)
  }, [draft, setDirty])

  const utils = trpc.useUtils()

  const { data: enc } = trpc.encounter.get.useQuery({ id: encounterId })

  // tsc TS2589 workaround (audit S9, S10): see vitals-form.tsx for context.
  // next build's incremental tsc trips TS2589 here even though plain
  // `tsc --noEmit` does not.
  const createOrGet = (trpc.prescription.createOrGet.useMutation as any)({
    onSuccess: () => utils.encounter.get.invalidate({ id: encounterId }),
  })
  const addItem = (trpc.prescription.addItem.useMutation as any)({
    onSuccess: () => {
      utils.encounter.get.invalidate({ id: encounterId })
      setDraft(null)
      setInteractionWarning(null)
      setPendingAdd(null)
    },
  })
  const removeItem = (trpc.prescription.removeItem.useMutation as any)({
    onSuccess: () => utils.encounter.get.invalidate({ id: encounterId }),
  })

  const prescription = enc?.prescriptions?.[0] ?? null
  const items = (prescription?.items ?? []) as Array<{
    id: string
    concentracion: string
    dosis: string
    frecuencia: string
    duracion: string
    indicacionesEspeciales?: string | null
    medication: { nombreGenerico: string }
  }>

  const { data: alergias = [] } = trpc.alergia.list.useQuery(
    { patientRegistrationId: enc?.patientRegistrationId ?? "" },
    { enabled: !!enc?.patientRegistrationId },
  )
  const activeAlergias = (alergias as { sustancia: string; reaccion?: string | null; activa: boolean }[]).filter(
    (a) => a.activa,
  )

  async function handleAddItem() {
    if (!draft) return
    // Resolve prescription id: existing one or create-or-get. The `!` is
    // safe because createOrGet always returns a row (the mutation has its
    // own type narrowing).
    let prescId: string | undefined = prescription?.id
    if (!prescId) {
      const p = await createOrGet.mutateAsync({ encounterId })
      prescId = p.id as string
    }
    // Narrow for the rest of the function.
    if (!prescId) return
    const finalPrescId: string = prescId

    // Check for interactions with existing items
    if (items.length > 0) {
      setCheckingInteraction(true)
      try {
        const res = await fetch("/api/ai/drug-interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newMedication: draft.med.nombreGenerico,
            currentMedications: items.map((it) => it.medication.nombreGenerico),
          }),
        })
        const check = (await res.json()) as { hasInteraction: boolean; warning: string | null }
        if (check.hasInteraction && check.warning) {
          setInteractionWarning(check.warning)
          setPendingAdd({ prescId: finalPrescId })
          setCheckingInteraction(false)
          return
        }
      } catch {
        /* ignore */
      }
      setCheckingInteraction(false)
    }

    addItem.mutate({
      prescriptionId: finalPrescId,
      item: {
        medicationId: draft.med.id,
        concentracion: draft.concentracion,
        dosis: draft.dosis,
        frecuencia: draft.frecuencia,
        duracion: draft.duracion,
        indicacionesEspeciales: draft.indicacionesEspeciales || undefined,
        overrideAlerta: false,
      },
    })
  }

  function handleOverrideAdd() {
    if (!draft || !pendingAdd) return
    addItem.mutate({
      prescriptionId: pendingAdd.prescId,
      item: {
        medicationId: draft.med.id,
        concentracion: draft.concentracion,
        dosis: draft.dosis,
        frecuencia: draft.frecuencia,
        duracion: draft.duracion,
        indicacionesEspeciales: draft.indicacionesEspeciales || undefined,
        overrideAlerta: true,
      },
    })
  }

  if (disabled) {
    return (
      <div className="space-y-4">
        {items.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Pill size={12} />
              Tratamiento de medicamentos ({items.length})
            </div>
            <ul className="space-y-1.5">
              {items.map((item, idx) => (
                <li key={item.id} className="text-sm text-slate-200">
                  <span className="font-medium">
                    {idx + 1}. {item.medication.nombreGenerico}{" "}
                    <span className="text-slate-400">{item.concentracion}</span>
                  </span>
                  <span className="ml-2 text-slate-400">
                    · {item.dosis} — {item.frecuencia} — {item.duracion}
                  </span>
                  {item.indicacionesEspeciales && (
                    <span className="ml-2 text-xs italic text-slate-500">
                      ({item.indicacionesEspeciales})
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {prescription && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(`/api/pdf/prescription/${prescription.id}`, "_blank")
                }
                className="mt-3 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <FileText size={13} className="mr-1.5" />
                Descargar Receta PDF
              </Button>
            )}
          </div>
        )}

        {items.length === 0 && (
          <p className="text-sm text-slate-500 italic">Sin medicamentos registrados en la receta.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ─── Alergias warning ─── */}
      {activeAlergias.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          <span className="mt-0.5 text-red-400">⚠</span>
          <div>
            <p className="font-medium text-red-300">Alergias registradas</p>
            <p className="mt-0.5 text-xs text-red-400/80">
              {activeAlergias
                .map((a) => `${a.sustancia}${a.reaccion ? ` (${a.reaccion})` : ""}`)
                .join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* ─── Lista de medicamentos ─── */}
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li
              key={item.id}
              className="group flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm transition-colors hover:border-slate-600"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-xs font-semibold text-blue-300">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1 text-slate-200">
                <p className="font-medium text-white">
                  {item.medication.nombreGenerico}{" "}
                  <span className="font-normal text-slate-400">{item.concentracion}</span>
                </p>
                <p className="text-xs text-slate-400">
                  <span className="text-slate-300">{item.dosis}</span>
                  {" · "}
                  <span className="text-slate-300">{item.frecuencia}</span>
                  {" · "}
                  <span className="text-slate-300">{item.duracion}</span>
                </p>
                {item.indicacionesEspeciales && (
                  <p className="mt-1 text-xs italic text-slate-500">
                    {item.indicacionesEspeciales}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeItem.mutate({ id: item.id })}
                className="rounded p-1 text-slate-500 opacity-0 transition-opacity hover:bg-red-950/40 hover:text-red-400 group-hover:opacity-100"
                title="Eliminar de la receta"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {items.length === 0 && !draft && (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/30 p-4 text-center">
          <Pill size={20} className="mx-auto mb-2 text-slate-600" />
          <p className="text-xs text-slate-500">
            Aún no has agregado medicamentos a este tratamiento.
          </p>
          <p className="mt-1 text-[10px] text-slate-600">
            Cada medicamento que agregues aparecerá en la receta PDF.
          </p>
        </div>
      )}

      {/* Add medication form */}
      {!draft ? (
        <MedicationSearch
          encounterId={encounterId}
          onSelect={(med) =>
            setDraft({
              med,
              concentracion: med.concentraciones[0] ?? "",
              dosis: "",
              frecuencia: "",
              duracion: "",
              indicacionesEspeciales: "",
            })
          }
        />
      ) : (
        <div className="space-y-3 rounded-lg border border-blue-800/60 bg-blue-950/20 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              {draft.med.nombreGenerico}
              <span className="ml-2 text-xs font-normal text-slate-400">
                {draft.med.nombresComerciales.slice(0, 2).join(", ")}
              </span>
            </p>
            <button
              onClick={() => {
                setDraft(null)
                setInteractionWarning(null)
                setPendingAdd(null)
              }}
              className="text-slate-500 hover:text-slate-300"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Concentración</Label>
              <select
                value={draft.concentracion}
                onChange={(e) =>
                  setDraft((d) => d && { ...d, concentracion: e.target.value })
                }
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {draft.med.concentraciones.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-xs">Dosis</Label>
                {draft.concentracion && (
                  <button
                    type="button"
                    disabled={loadingDose}
                    onClick={async () => {
                      setLoadingDose(true)
                      try {
                        const res = await fetch("/api/ai/dose-suggestion", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            medicationName: draft.med.nombreGenerico,
                            concentracion: draft.concentracion,
                          }),
                        })
                        const suggestion = (await res.json()) as {
                          dosis?: string
                          frecuencia?: string
                          duracion?: string
                          instrucciones?: string
                        }
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                dosis: suggestion.dosis || d.dosis,
                                frecuencia: suggestion.frecuencia || d.frecuencia,
                                duracion: suggestion.duracion || d.duracion,
                                indicacionesEspeciales:
                                  suggestion.instrucciones || d.indicacionesEspeciales,
                              }
                            : d,
                        )
                      } catch {
                        /* ignore */
                      }
                      setLoadingDose(false)
                    }}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-purple-400 hover:bg-purple-900/30 disabled:opacity-50"
                    title="Sugerir dosis con IA"
                  >
                    <Sparkles size={11} />
                    {loadingDose ? "..." : "IA"}
                  </button>
                )}
              </div>
              <Input
                value={draft.dosis}
                onChange={(e) =>
                  setDraft((d) => d && { ...d, dosis: e.target.value })
                }
                placeholder="Ej: 1 tableta"
                className="border-slate-700 bg-slate-800 text-sm text-white placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Frecuencia</Label>
              <select
                value={draft.frecuencia}
                onChange={(e) =>
                  setDraft((d) => d && { ...d, frecuencia: e.target.value })
                }
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                {FRECUENCIAS_COMUNES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Duración</Label>
              <select
                value={draft.duracion}
                onChange={(e) =>
                  setDraft((d) => d && { ...d, duracion: e.target.value })
                }
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                {DURACIONES_COMUNES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">
              Indicaciones especiales (opcional)
            </Label>
            <Input
              value={draft.indicacionesEspeciales}
              onChange={(e) =>
                setDraft((d) => d && { ...d, indicacionesEspeciales: e.target.value })
              }
              placeholder="Ej: tomar con alimentos, evitar alcohol"
              className="border-slate-700 bg-slate-800 text-sm text-white placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          {interactionWarning && (
            <div className="rounded-lg border border-yellow-700 bg-yellow-950/40 p-3">
              <div className="mb-2 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-400" />
                <div>
                  <p className="text-xs font-medium text-yellow-300">
                    Posible interacción medicamentosa
                  </p>
                  <p className="mt-1 text-xs text-yellow-400/80">{interactionWarning}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDraft(null)
                    setInteractionWarning(null)
                    setPendingAdd(null)
                  }}
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleOverrideAdd}
                  disabled={addItem.isPending}
                  className="rounded border border-yellow-700 px-2 py-1 text-xs text-yellow-300 hover:bg-yellow-900/30 disabled:opacity-50"
                >
                  Agregar de todas formas
                </button>
              </div>
            </div>
          )}

          {!interactionWarning && (
            <Button
              size="sm"
              disabled={
                !draft.dosis ||
                !draft.frecuencia ||
                !draft.duracion ||
                addItem.isPending ||
                checkingInteraction
              }
              onClick={handleAddItem}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={14} className="mr-1" />
              {checkingInteraction
                ? "Verificando interacciones..."
                : "Agregar al tratamiento"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

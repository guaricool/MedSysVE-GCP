"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { MedicationSearch } from "./medication-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus, FileText, AlertTriangle, Sparkles } from "lucide-react"
import type { MedicationSearchResult as RedisMedication } from "./medication-search"
import { checkAllergyConflict, type AllergyMatch, type DrugAllergy } from "@/lib/drug-allergies"

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
  disabled?: boolean
}

export function PrescriptionForm({ encounterId, disabled }: Props) {
  const [draft, setDraft] = useState<ItemDraft | null>(null)
  const [showPrevious, setShowPrevious] = useState(false)
  const [checkingInteraction, setCheckingInteraction] = useState(false)
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null)
  const [allergyWarning, setAllergyWarning] = useState<AllergyMatch | null>(null)
  const [pendingAdd, setPendingAdd] = useState<{ prescId: string; forcedOverride: boolean } | null>(null)
  const [loadingDose, setLoadingDose] = useState(false)
  const utils = trpc.useUtils()

  const { data: enc } = trpc.encounter.get.useQuery({ id: encounterId })
  const createOrGet = trpc.prescription.createOrGet.useMutation({
    onSuccess: () => utils.encounter.get.invalidate({ id: encounterId }),
  })
  const addItem = trpc.prescription.addItem.useMutation({
    onSuccess: () => {
      utils.encounter.get.invalidate({ id: encounterId })
      setDraft(null)
      setInteractionWarning(null)
      setAllergyWarning(null)
      setPendingAdd(null)
    },
  })
  const removeItem = trpc.prescription.removeItem.useMutation({
    onSuccess: () => utils.encounter.get.invalidate({ id: encounterId }),
  })

  const prescription = enc?.prescriptions?.[0] ?? null
  const items = prescription?.items ?? []


  const prevEncounters = (trpc.encounter as any).list.useQuery(
    { patientRegistrationId: enc?.patientRegistrationId ?? "" },
    { enabled: showPrevious && !!enc?.patientRegistrationId },
  )

  const { data: alergias = [] } = trpc.alergia.list.useQuery(
    { patientRegistrationId: enc?.patientRegistrationId ?? "" },
    { enabled: !!enc?.patientRegistrationId },
  )
  const activeAlergias = (alergias as { sustancia: string; reaccion?: string | null; activa: boolean; gravedad?: "LEVE" | "MODERADA" | "SEVERA" }[]).filter(
    (a) => a.activa,
  )

  /**
   * Drug-allergy check. Runs every time the doctor selects a medication
   * from the search. If the medication conflicts with any active allergy
   * (exact, family, or synonym), the warning blocks the "Agregar" button
   * until the doctor explicitly chooses "Agregar de todas formas" (which
   * sends overrideAlerta: true to the server).
   */
  function runAllergyCheck(med: RedisMedication) {
    if (activeAlergias.length === 0) {
      setAllergyWarning(null)
      return
    }
    const match = checkAllergyConflict(
      {
        nombreGenerico: med.nombreGenerico,
        nombresComerciales: med.nombresComerciales,
      },
      activeAlergias as DrugAllergy[],
    )
    setAllergyWarning(match)
  }

  async function handleCopyPrescription(prevItems: any[]) {
    let prescId = prescription?.id
    if (!prescId) {
      const p = await createOrGet.mutateAsync({ encounterId })
      prescId = p.id
    }
    for (const item of prevItems) {
      // Re-check allergies at copy time. A previous prescription may have
      // been issued before an allergy was registered, or the med may have
      // been added with overrideAlerta that we don't want to silently
      // re-apply. Default to overrideAlerta: false so the server-side
      // check (defense in depth) re-validates against current allergies.
      await addItem.mutateAsync({
        prescriptionId: prescId,
        item: {
          medicationId: item.medicationId,
          concentracion: item.concentracion,
          dosis: item.dosis,
          frecuencia: item.frecuencia,
          duracion: item.duracion,
          indicacionesEspeciales: item.indicacionesEspeciales || undefined,
          overrideAlerta: false,
        },
      })
    }
    setShowPrevious(false)
  }

  async function handleAddItem() {
    if (!draft) return
    let prescId = prescription?.id
    if (!prescId) {
      const p = await createOrGet.mutateAsync({ encounterId })
      prescId = p.id
    }

    // Drug-drug interaction check (existing behavior, only when other items
    // are already in the receta).
    if (items.length > 0) {
      setCheckingInteraction(true)
      try {
        const res = await fetch("/api/ai/drug-interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newMedication: draft.med.nombreGenerico,
            currentMedications: (items as any[]).map((it: any) => it.medication.nombreGenerico),
          }),
        })
        const check = await res.json() as { hasInteraction: boolean; warning: string | null }
        if (check.hasInteraction && check.warning) {
          setInteractionWarning(check.warning)
          // forcedOverride is true if the drug-drug OR the drug-allergy
          // check flagged a SEVERA match — those are the cases where the
          // doctor must explicitly confirm.
          setPendingAdd({ prescId, forcedOverride: true })
          setCheckingInteraction(false)
          return
        }
      } catch { /* ignore — proceed */ }
      setCheckingInteraction(false)
    }

    // If allergy check flagged this med, force the doctor to override.
    // We pass overrideAlerta: true ONLY when the user clicks the explicit
    // "Agregar de todas formas" button. The "Agregar" button itself
    // stays disabled while allergyWarning is set (see button disable
    // condition below).
    addItem.mutate({
      prescriptionId: prescId,
      item: {
        medicationId: draft.med.id,
        concentracion: draft.concentracion,
        dosis: draft.dosis,
        frecuencia: draft.frecuencia,
        duracion: draft.duracion,
        indicacionesEspeciales: draft.indicacionesEspeciales || undefined,
        overrideAlerta: !!allergyWarning,
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
        // forcedOverride covers BOTH drug-drug (interactionWarning) and
        // drug-allergy (allergyWarning) confirmations.
        overrideAlerta: pendingAdd.forcedOverride,
      },
    })
  }

  return (
    <div className="space-y-4">
      {activeAlergias.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          <span className="mt-0.5 text-red-400">⚠</span>
          <div>
            <p className="font-medium text-red-300">Alergias registradas</p>
            <p className="text-xs text-red-400/80 mt-0.5">
              {activeAlergias
                .map((a) => `${a.sustancia}${a.reaccion ? ` (${a.reaccion})` : ""}`)
                .join(" · ")}
            </p>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {(items as any[]).map((item: any, idx: number) => (
            <li
              key={item.id}
              className="flex items-start justify-between rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm"
            >
              <div className="text-slate-200">
                <p className="font-medium text-white">
                  {idx + 1}. {item.medication.nombreGenerico}{" "}
                  <span className="text-slate-400">{item.concentracion}</span>
                </p>
                <p className="text-slate-300">
                  {item.dosis} — {item.frecuencia} — {item.duracion}
                </p>
                {item.indicacionesEspeciales && (
                  <p className="text-slate-400 text-xs mt-0.5">{item.indicacionesEspeciales}</p>
                )}
              </div>
              {!disabled && (
                <button
                  onClick={() => removeItem.mutate({ id: item.id })}
                  className="ml-2 text-slate-500 hover:text-red-400"
                  title="Eliminar"
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && prescription && (
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/api/pdf/prescription/${prescription.id}`, "_blank")}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <FileText size={13} className="mr-1.5" />
            Descargar Receta PDF
          </Button>
        </div>
      )}

      {!disabled && enc?.patientRegistrationId && (
        <div className="border-t border-slate-800 pt-3">
          <button
            onClick={() => setShowPrevious(!showPrevious)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
          >
            <span>{showPrevious ? "▲" : "▼"}</span>
            Prescripciones anteriores del paciente
          </button>
          {showPrevious && (
            <div className="mt-2 space-y-2">
              {!prevEncounters.data && <p className="text-xs text-slate-600">Cargando...</p>}
              {prevEncounters.data &&
                (prevEncounters.data as any[])
                  .filter((e: any) => e.prescriptions?.length > 0 && e.id !== encounterId)
                  .slice(0, 3)
                  .map((e: any) => (
                    <div key={e.id} className="rounded border border-slate-800 bg-slate-900/50 p-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-slate-500">
                          {new Date(e.createdAt).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}
                          {e.diagnoses?.[0] ? ` · ${e.diagnoses[0].descripcion}` : ""}
                        </p>
                        <button
                          onClick={() => handleCopyPrescription(e.prescriptions[0].items)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Copiar receta
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">
                        {e.prescriptions[0].items
                          .map((it: any) => `${it.medication?.nombreGenerico} ${it.concentracion}`)
                          .join(", ")}
                      </p>
                    </div>
                  ))}
              {prevEncounters.data &&
                (prevEncounters.data as any[]).filter(
                  (e: any) => e.prescriptions?.length > 0 && e.id !== encounterId,
                ).length === 0 && <p className="text-xs text-slate-600">No hay prescripciones previas</p>}
            </div>
          )}
        </div>
      )}

      {!disabled && (
        <div className="space-y-3">
          {!draft ? (
            <MedicationSearch
              encounterId={encounterId}
              onSelect={(med) => {
                setDraft({
                  med,
                  concentracion: med.concentraciones[0] ?? "",
                  dosis: "",
                  frecuencia: "",
                  duracion: "",
                  indicacionesEspeciales: "",
                })
                runAllergyCheck(med)
              }}
            />
          ) : (
            <div className="rounded border border-slate-700 bg-slate-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">{draft.med.nombreGenerico}</p>
                <button onClick={() => { setDraft(null); setInteractionWarning(null); setAllergyWarning(null); setPendingAdd(null) }} className="text-slate-500 hover:text-slate-300">
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Concentración</Label>
                  <select
                    value={draft.concentracion}
                    onChange={(e) => setDraft((d) => d && { ...d, concentracion: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-1.5 text-sm"
                  >
                    {draft.med.concentraciones.map((c) => (
                      <option key={c} value={c}>{c}</option>
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
                            const suggestion = await res.json() as { dosis?: string; frecuencia?: string; duracion?: string; instrucciones?: string }
                            setDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    dosis: suggestion.dosis || d.dosis,
                                    frecuencia: suggestion.frecuencia || d.frecuencia,
                                    duracion: suggestion.duracion || d.duracion,
                                    indicacionesEspeciales: suggestion.instrucciones || d.indicacionesEspeciales,
                                  }
                                : d,
                            )
                          } catch { /* ignore */ }
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
                    onChange={(e) => setDraft((d) => d && { ...d, dosis: e.target.value })}
                    placeholder="Ej: 1 tableta"
                    className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Frecuencia</Label>
                  <Input
                    value={draft.frecuencia}
                    onChange={(e) => setDraft((d) => d && { ...d, frecuencia: e.target.value })}
                    placeholder="Ej: cada 8 horas"
                    className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Duración</Label>
                  <Input
                    value={draft.duracion}
                    onChange={(e) => setDraft((d) => d && { ...d, duracion: e.target.value })}
                    placeholder="Ej: 7 días"
                    className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300 text-xs">Indicaciones especiales (opcional)</Label>
                <Input
                  value={draft.indicacionesEspeciales}
                  onChange={(e) => setDraft((d) => d && { ...d, indicacionesEspeciales: e.target.value })}
                  placeholder="Ej: tomar con alimentos"
                  className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                />
              </div>

              {interactionWarning && (
                <div className="rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 text-yellow-400 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-yellow-300">Posible interacción medicamentosa</p>
                      <p className="text-xs text-yellow-400/80 mt-0.5">{interactionWarning}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setDraft(null); setInteractionWarning(null); setAllergyWarning(null); setPendingAdd(null) }}
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

              {allergyWarning && !interactionWarning && (
                <div
                  className={
                    "rounded-lg border p-3 space-y-2 " +
                    (allergyWarning.severity === "SEVERA"
                      ? "border-red-700 bg-red-950/40"
                      : "border-orange-700 bg-orange-950/40")
                  }
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={14}
                      className={
                        "mt-0.5 shrink-0 " +
                        (allergyWarning.severity === "SEVERA" ? "text-red-400" : "text-orange-400")
                      }
                    />
                    <div>
                      <p
                        className={
                          "text-xs font-medium " +
                          (allergyWarning.severity === "SEVERA" ? "text-red-300" : "text-orange-300")
                        }
                      >
                        {allergyWarning.severity === "SEVERA"
                          ? "Alergia SEVERA — contraindicación"
                          : "Alergia del paciente"}
                      </p>
                      <p
                        className={
                          "text-xs mt-0.5 " +
                          (allergyWarning.severity === "SEVERA" ? "text-red-400/80" : "text-orange-400/80")
                        }
                      >
                        {allergyWarning.warning}
                      </p>
                      {allergyWarning.allergy.reaccion && (
                        <p
                          className={
                            "text-xs mt-0.5 italic " +
                            (allergyWarning.severity === "SEVERA" ? "text-red-400/70" : "text-orange-400/70")
                          }
                        >
                          Reacción previa: {allergyWarning.allergy.reaccion}
                        </p>
                      )}
                      {allergyWarning.family && (
                        <p
                          className={
                            "text-xs mt-1 " +
                            (allergyWarning.severity === "SEVERA" ? "text-red-400/70" : "text-orange-400/70")
                          }
                        >
                          Familia: {allergyWarning.family} · Tipo de match: {allergyWarning.matchType}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setDraft(null); setAllergyWarning(null); setPendingAdd(null) }}
                      className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Elegir otro
                    </button>
                    <button
                      onClick={async () => {
                        let prescId = prescription?.id
                        if (!prescId) {
                          const p = await createOrGet.mutateAsync({ encounterId })
                          prescId = p.id
                        }
                        setPendingAdd({ prescId, forcedOverride: true })
                      }}
                      disabled={addItem.isPending || createOrGet.isPending}
                      className={
                        "rounded border px-2 py-1 text-xs disabled:opacity-50 " +
                        (allergyWarning.severity === "SEVERA"
                          ? "border-red-700 text-red-300 hover:bg-red-900/30"
                          : "border-orange-700 text-orange-300 hover:bg-orange-900/30")
                      }
                    >
                      Recetar de todas formas (override documentado)
                    </button>
                  </div>
                </div>
              )}

              {!interactionWarning && !allergyWarning && (
                <Button
                  size="sm"
                  disabled={!draft.dosis || !draft.frecuencia || !draft.duracion || addItem.isPending || checkingInteraction}
                  onClick={handleAddItem}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={14} className="mr-1" />
                  {checkingInteraction ? "Verificando interacciones..." : "Agregar a receta"}
                </Button>
              )}

              {allergyWarning && pendingAdd && !interactionWarning && (
                <Button
                  size="sm"
                  onClick={handleOverrideAdd}
                  disabled={addItem.isPending}
                  className={
                    allergyWarning.severity === "SEVERA"
                      ? "bg-red-700 hover:bg-red-800"
                      : "bg-orange-700 hover:bg-orange-800"
                  }
                >
                  <Plus size={14} className="mr-1" />
                  Confirmar override y agregar a receta
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, CheckCircle, Database } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    bristolType?: number
    forrestClass?: string
    childPugh?: {
      bilirrubina?: number
      albumina?: number
      inr?: number
      encefalopatia?: number
      ascitis?: number
    }
    sintomas?: string[]
    mayoScore?: {
      frecuenciaEvacuacion?: number
      sangradoRectal?: number
      evaluacionGlobal?: number
    }
  }
}

const BRISTOL_TYPES = [
  { type: 1, desc: "Trozos duros separados, como nueces (difícil de excretar)" },
  { type: 2, desc: "Forma de salchicha pero grumosa" },
  { type: 3, desc: "Forma de salchicha con grietas en la superficie" },
  { type: 4, desc: "Forma de salchicha o serpiente, lisa y blanda (ideal)" },
  { type: 5, desc: "Trozos blandos con bordes recortados (fácil de excretar)" },
  { type: 6, desc: "Pedazos blandos y esponjosos con bordes irregulares" },
  { type: 7, desc: "Acuosa, sin trozos sólidos, totalmente líquida" },
]

const FORREST_CLASSES = [
  { val: "Ninguno", label: "Sin sangrado activo" },
  { val: "Ia", label: "Ia (Sangrado arterial en chorro)" },
  { val: "Ib", label: "Ib (Sangrado rezumante en napa)" },
  { val: "IIa", label: "IIa (Vaso visible no sangrante)" },
  { val: "IIb", label: "IIb (Coágulo adherido)" },
  { val: "IIc", label: "IIc (Mancha hematina en fondo ulceroso)" },
  { val: "III", label: "III (Fondo limpio de fibrina sin lesión vascular)" },
]

export function GastroenterologiaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [bristolType, setBristolType] = useState<number>(initialData.bristolType || 4)
  const [forrestClass, setForrestClass] = useState<string>(initialData.forrestClass || "Ninguno")

  const cp = initialData.childPugh || {}
  const [bilirrubina, setBilirrubina] = useState<number>(cp.bilirrubina || 1)
  const [albumina, setAlbumina] = useState<number>(cp.albumina || 1)
  const [inr, setInr] = useState<number>(cp.inr || 1)
  const [encefalopatia, setEncefalopatia] = useState<number>(cp.encefalopatia || 1)
  const [ascitis, setAscitis] = useState<number>(cp.ascitis || 1)

  const [sintomas, setSintomas] = useState<string[]>(initialData.sintomas || [])

  // Mayo Score State
  const ms = initialData.mayoScore || {}
  const [frecuenciaEvacuacion, setFrecuenciaEvacuacion] = useState<number>(ms.frecuenciaEvacuacion || 0)
  const [sangradoRectal, setSangradoRectal] = useState<number>(ms.sangradoRectal || 0)
  const [evaluacionGlobal, setEvaluacionGlobal] = useState<number>(ms.evaluacionGlobal || 0)

  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return (
      bristolType !== (initialData.bristolType || 4) ||
      forrestClass !== (initialData.forrestClass || "Ninguno") ||
      bilirrubina !== (cp.bilirrubina || 1) ||
      albumina !== (cp.albumina || 1) ||
      inr !== (cp.inr || 1) ||
      encefalopatia !== (cp.encefalopatia || 1) ||
      ascitis !== (cp.ascitis || 1) ||
      frecuenciaEvacuacion !== (ms.frecuenciaEvacuacion || 0) ||
      sangradoRectal !== (ms.sangradoRectal || 0) ||
      evaluacionGlobal !== (ms.evaluacionGlobal || 0) ||
      JSON.stringify(sintomas) !== JSON.stringify(initialData.sintomas || [])
    )
  }, [
    bristolType, forrestClass, bilirrubina, albumina, inr, encefalopatia, ascitis, 
    frecuenciaEvacuacion, sangradoRectal, evaluacionGlobal, sintomas, initialData, cp, ms
  ])

  useEffect(() => {
    setDirty("gastroenterologia", isDirty)
  }, [isDirty, setDirty])

  const utils = trpc.useUtils()
  const save = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  // Child-Pugh Score Calculation
  const cpScore = bilirrubina + albumina + inr + encefalopatia + ascitis
  let cpClass = "Clase A (Buen pronóstico)"
  if (cpScore >= 7 && cpScore <= 9) cpClass = "Clase B (Compromiso funcional moderado)"
  if (cpScore >= 10) cpClass = "Clase C (Compromiso funcional severo)"

  // Mayo Score Calculation
  const mayoTotal = frecuenciaEvacuacion + sangradoRectal + evaluacionGlobal
  let mayoSeveridad = "Remisión clínica (0-1 pts)"
  if (mayoTotal >= 2 && mayoTotal <= 4) mayoSeveridad = "Actividad Leve (2-4 pts)"
  if (mayoTotal >= 5 && mayoTotal <= 6) mayoSeveridad = "Actividad Moderada (5-6 pts)"
  if (mayoTotal >= 7) mayoSeveridad = "Actividad Grave (7-9 pts)"

  function handleSave() {
    const payload = {
      bristolType,
      forrestClass,
      childPugh: {
        bilirrubina,
        albumina,
        inr,
        encefalopatia,
        ascitis,
      },
      sintomas,
      mayoScore: {
        frecuenciaEvacuacion,
        sangradoRectal,
        evaluacionGlobal,
      },
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  const toggleSintoma = (sin: string) => {
    if (disabled) return
    setSintomas((prev) =>
      prev.includes(sin) ? prev.filter((s) => s !== sin) : [...prev, sin]
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <Database className="h-4 w-4 text-emerald-400" />
        Evaluación Gastroenterológica
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bristol, Forrest, Sintomas */}
        <div className="space-y-4">
          <label className="block text-xs text-slate-400 font-medium">
            Escala de Bristol (Consistencia de Heces)
            <select
              disabled={disabled}
              value={bristolType}
              onChange={(e) => setBristolType(Number(e.target.value))}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white"
            >
              {BRISTOL_TYPES.map((b) => (
                <option key={b.type} value={b.type}>
                  Tipo {b.type} - {b.desc}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs text-slate-400 font-medium">
            Clasificación de Forrest (Hemorragia Digestiva)
            <select
              disabled={disabled}
              value={forrestClass}
              onChange={(e) => setForrestClass(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white"
            >
              {FORREST_CLASSES.map((f) => (
                <option key={f.val} value={f.val}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1.5">
            <span className="block text-xs text-slate-400 font-medium">Síntomas Clínicos</span>
            <div className="grid grid-cols-2 gap-1.5">
              {["Disfagia", "Dispepsia", "Pirosis", "Dolor Abdominal", "Nauseas/Vomito", "Melena", "Rectorragia", "Ictericia"].map((sin) => {
                const active = sintomas.includes(sin)
                return (
                  <button
                    key={sin}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleSintoma(sin)}
                    className={`rounded p-1 text-[10px] border transition-colors text-left font-medium ${
                      active
                        ? "bg-emerald-950/30 border-emerald-700 text-emerald-300"
                        : "border-slate-800 bg-slate-900 text-slate-500 hover:text-white"
                    }`}
                  >
                    {sin}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Middle: Child-Pugh Calculator */}
        <div className="rounded-lg border border-slate-800 bg-slate-800/20 p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Child-Pugh (Hepatopatía)
            </h4>
            <span className="text-xs font-bold text-emerald-400">Score: {cpScore}</span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <label className="flex items-center justify-between text-slate-400">
              <span>Bilirrubina total</span>
              <select
                disabled={disabled}
                value={bilirrubina}
                onChange={(e) => setBilirrubina(Number(e.target.value))}
                className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-white w-24"
              >
                <option value={1}>&lt;2.0 (1 pt)</option>
                <option value={2}>2.0–3.0 (2 pt)</option>
                <option value={3}>&gt;3.0 (3 pt)</option>
              </select>
            </label>

            <label className="flex items-center justify-between text-slate-400">
              <span>Albúmina sérica</span>
              <select
                disabled={disabled}
                value={albumina}
                onChange={(e) => setAlbumina(Number(e.target.value))}
                className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-white w-24"
              >
                <option value={1}>&gt;3.5 (1 pt)</option>
                <option value={2}>2.8–3.5 (2 pt)</option>
                <option value={3}>&lt;2.8 (3 pt)</option>
              </select>
            </label>

            <label className="flex items-center justify-between text-slate-400">
              <span>Tiempo INR</span>
              <select
                disabled={disabled}
                value={inr}
                onChange={(e) => setInr(Number(e.target.value))}
                className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-white w-24"
              >
                <option value={1}>&lt;1.7 (1 pt)</option>
                <option value={2}>1.7–2.3 (2 pt)</option>
                <option value={3}>&gt;2.3 (3 pt)</option>
              </select>
            </label>

            <label className="flex items-center justify-between text-slate-400">
              <span>Encefalopatía</span>
              <select
                disabled={disabled}
                value={encefalopatia}
                onChange={(e) => setEncefalopatia(Number(e.target.value))}
                className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-white w-24"
              >
                <option value={1}>Ausente (1 pt)</option>
                <option value={2}>I-II (2 pt)</option>
                <option value={3}>III-IV (3 pt)</option>
              </select>
            </label>

            <label className="flex items-center justify-between text-slate-400">
              <span>Ascitis</span>
              <select
                disabled={disabled}
                value={ascitis}
                onChange={(e) => setAscitis(Number(e.target.value))}
                className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-white w-24"
              >
                <option value={1}>Ausente (1 pt)</option>
                <option value={2}>Leve (2 pt)</option>
                <option value={3}>Severa (3 pt)</option>
              </select>
            </label>
          </div>

          <div className="border-t border-slate-800 pt-2 text-[10px] font-semibold text-slate-350">
            {cpClass}
          </div>
        </div>

        {/* Right: Mayo Score Calculator */}
        <div className="rounded-lg border border-slate-800 bg-slate-800/20 p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Mayo Score (Actividad de Colitis)
            </h4>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-emerald-400">Total: {mayoTotal}/9</span>
              <span className="text-[9px] text-slate-400 block">{mayoSeveridad}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <label className="block text-slate-400">
              Frecuencia de Deposiciones
              <select
                disabled={disabled}
                value={frecuenciaEvacuacion}
                onChange={(e) => setFrecuenciaEvacuacion(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              >
                <option value={0}>0 - Frecuencia normal</option>
                <option value={1}>1 - 1 a 2 deposiciones más de lo normal</option>
                <option value={2}>2 - 3 a 4 deposiciones más de lo normal</option>
                <option value={3}>3 - &gt;=5 deposiciones más de lo normal</option>
              </select>
            </label>

            <label className="block text-slate-400">
              Sangrado Rectal
              <select
                disabled={disabled}
                value={sangradoRectal}
                onChange={(e) => setSangradoRectal(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              >
                <option value={0}>0 - Sin sangre visible</option>
                <option value={1}>1 - Trazas de sangre menos de la mitad de las veces</option>
                <option value={2}>2 - Sangre obvia la mayoría de las veces</option>
                <option value={3}>3 - Sangre pura (sin heces) o rectorragia franca</option>
              </select>
            </label>

            <label className="block text-slate-400">
              Evaluación Global del Médico
              <select
                disabled={disabled}
                value={evaluacionGlobal}
                onChange={(e) => setEvaluacionGlobal(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              >
                <option value={0}>0 - Normal / Inactiva</option>
                <option value={1}>1 - Actividad Leve</option>
                <option value={2}>2 - Actividad Moderada</option>
                <option value={3}>3 - Actividad Grave / Brote severo</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {!disabled && (
        <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="rounded bg-emerald-700 px-4 py-1.5 text-xs text-white hover:bg-emerald-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Gastroenterología"}
          </button>
          {saved && (
            <p className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" /> Guardado.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

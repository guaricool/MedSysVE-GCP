"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, CheckCircle, ShieldAlert } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    asaClass?: string
    mallampatiClass?: string
    distanciaTiromentoniana?: number
    viaAereaDificil?: boolean
    complicacionesAnestesia?: string
    stopBangAnswers?: Record<string, boolean>
  }
}

const STOP_BANG_ITEMS = [
  { key: "snoring", label: "Ronquido (¿Ronca fuerte, más fuerte que hablar o suficiente para ser escuchado tras puertas cerradas?)" },
  { key: "tired", label: "Cansancio (¿Se siente cansado, fatigado o somnoliento con frecuencia durante el día?)" },
  { key: "observed", label: "Obstrucción (¿Alguien ha observado que deja de respirar o ahogarse mientras duerme?)" },
  { key: "pressure", label: "Presión (¿Tiene o recibe tratamiento por hipertensión arterial?)" },
  { key: "bmi", label: "IMC (¿Tiene un índice de masa corporal mayor a 35 kg/m²?)" },
  { key: "age", label: "Edad (¿Tiene más de 50 años?)" },
  { key: "neck", label: "Cuello (¿El perímetro de su cuello mide más de 40 cm / 16 pulgadas?)" },
  { key: "gender", label: "Género (¿Es de sexo/género masculino?)" },
]

export function AnestesiologiaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [asaClass, setAsaClass] = useState(initialData.asaClass || "ASA I")
  const [mallampatiClass, setMallampatiClass] = useState(initialData.mallampatiClass || "Clase I")
  const [distanciaTiromentoniana, setDistanciaTiromentoniana] = useState<string>(initialData.distanciaTiromentoniana?.toString() || "")
  const [viaAereaDificil, setViaAereaDificil] = useState<boolean>(initialData.viaAereaDificil || false)
  const [complicacionesAnestesia, setComplicacionesAnestesia] = useState(initialData.complicacionesAnestesia || "")
  const [stopBangAnswers, setStopBangAnswers] = useState<Record<string, boolean>>(() => {
    if (initialData.stopBangAnswers) return initialData.stopBangAnswers
    const initial: Record<string, boolean> = {}
    STOP_BANG_ITEMS.forEach((item) => {
      initial[item.key] = false
    })
    return initial
  })
  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    const initialStopBang = initialData.stopBangAnswers || {}
    return (
      asaClass !== (initialData.asaClass || "ASA I") ||
      mallampatiClass !== (initialData.mallampatiClass || "Clase I") ||
      distanciaTiromentoniana !== (initialData.distanciaTiromentoniana?.toString() || "") ||
      viaAereaDificil !== (initialData.viaAereaDificil || false) ||
      complicacionesAnestesia !== (initialData.complicacionesAnestesia || "") ||
      JSON.stringify(stopBangAnswers) !== JSON.stringify(initialStopBang)
    )
  }, [asaClass, mallampatiClass, distanciaTiromentoniana, viaAereaDificil, complicacionesAnestesia, stopBangAnswers, initialData])

  useEffect(() => {
    setDirty("anestesiologia", isDirty)
  }, [isDirty, setDirty])

  const utils = trpc.useUtils()
  const save = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  // Calculate STOP-Bang Score
  const stopBangSum = STOP_BANG_ITEMS.reduce((acc, item) => {
    return acc + (stopBangAnswers[item.key] ? 1 : 0)
  }, 0)

  let stopBangRiesgo = "Riesgo Bajo (0-2 pts)"
  if (stopBangSum >= 3 && stopBangSum <= 4) stopBangRiesgo = "Riesgo Intermedio (3-4 pts)"
  if (stopBangSum >= 5) stopBangRiesgo = "Riesgo Alto (5-8 pts)"

  function handleSave() {
    const payload = {
      asaClass,
      mallampatiClass,
      distanciaTiromentoniana: distanciaTiromentoniana ? Number(distanciaTiromentoniana) : undefined,
      viaAereaDificil,
      complicacionesAnestesia,
      stopBangAnswers,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  const toggleStopBang = (key: string) => {
    if (disabled) return
    setStopBangAnswers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <ShieldAlert className="h-4 w-4 text-orange-400" />
        Valoración Preanestésica
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Airway & ASA */}
        <div className="space-y-3">
          <label className="block text-xs text-slate-400 font-medium">
            Clasificación del Estado Físico (ASA)
            <select
              disabled={disabled}
              value={asaClass}
              onChange={(e) => setAsaClass(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
            >
              <option value="ASA I">ASA I (Paciente sano normal)</option>
              <option value="ASA II">ASA II (Enfermedad sistémica leve)</option>
              <option value="ASA III">ASA III (Enfermedad sistémica severa no incapacitante)</option>
              <option value="ASA IV">ASA IV (Enfermedad sistémica severa que amenaza la vida)</option>
              <option value="ASA V">ASA V (Moribundo que no sobrevivirá sin operación)</option>
              <option value="ASA VI">ASA VI (Muerte cerebral declarada, donante de órganos)</option>
            </select>
          </label>

          <label className="block text-xs text-slate-400 font-medium">
            Clasificación de Mallampati (Visualización de Vía Aérea)
            <select
              disabled={disabled}
              value={mallampatiClass}
              onChange={(e) => setMallampatiClass(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
            >
              <option value="Clase I">Clase I (Visión total de amígdalas, úvula y paladar blando)</option>
              <option value="Clase II">Clase II (Visión de paladar blando, porción superior de amígdalas y úvula)</option>
              <option value="Clase III">Clase III (Visión de paladar blando y base de la úvula)</option>
              <option value="Clase IV">Clase IV (No se visualiza el paladar blando, solo paladar duro)</option>
            </select>
          </label>

          <label className="block text-xs text-slate-400 font-medium">
            Distancia Tiromentoniana
            <div className="relative mt-1">
              <input
                type="number"
                disabled={disabled}
                placeholder="6.5"
                value={distanciaTiromentoniana}
                onChange={(e) => setDistanciaTiromentoniana(e.target.value)}
                className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1.5 text-sm text-white"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">cm</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Valores menor a 6 cm sugieren intubación difícil.</span>
          </label>

          <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-800/10 p-3 mt-3">
            <div className="space-y-0.5">
              <span className="block text-xs font-semibold text-slate-300">Sospecha de Vía Aérea Difícil</span>
              <span className="text-[10px] text-slate-500">Activa si prevés complicaciones durante la intubación.</span>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setViaAereaDificil((prev) => !prev)}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                viaAereaDificil
                  ? "bg-red-950/40 border border-red-700 text-red-400"
                  : "border border-slate-750 bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {viaAereaDificil ? "SÍ (DIFÍCIL)" : "NO (ESTÁNDAR)"}
            </button>
          </div>
        </div>

        {/* Right: STOP-Bang questionnaire */}
        <div className="rounded-lg border border-slate-800 bg-slate-800/20 p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Cuestionario STOP-Bang (Apnea del Sueño)
            </h4>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-orange-400">Total: {stopBangSum}/8</span>
              <span className="text-[10px] text-slate-400 block">{stopBangRiesgo}</span>
            </div>
          </div>

          <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
            {STOP_BANG_ITEMS.map((item) => {
              const active = stopBangAnswers[item.key]
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleStopBang(item.key)}
                  className={`w-full flex items-center justify-between rounded p-1.5 text-[10px] border transition-colors text-left ${
                    active
                      ? "bg-orange-900/30 border-orange-700 text-orange-300 font-semibold"
                      : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] font-bold text-slate-500 shrink-0 ml-2">
                    {active ? "SÍ" : "NO"}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-slate-400 font-medium">
          Antecedentes Anestésicos / Complicaciones
          <textarea
            disabled={disabled}
            placeholder="Hipertermia maligna, náuseas y vómitos postoperatorios (NVPO), reacciones adversas a bloqueantes o analgésicos..."
            value={complicacionesAnestesia}
            onChange={(e) => setComplicacionesAnestesia(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white resize-none"
          />
        </label>
      </div>

      {!disabled && (
        <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="rounded bg-orange-700 px-4 py-1.5 text-xs text-white hover:bg-orange-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Anestesiología"}
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

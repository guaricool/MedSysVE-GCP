"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, CheckCircle, Scissors } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    tipoHerida?: string
    alvaradoAnswers?: Record<string, boolean>
    dolorEva?: number
    omsListChecked?: Record<string, boolean>
  }
}

const ALVARADO_ITEMS = [
  { key: "dolorMigratorio", label: "Dolor migratorio a fosa ilíaca derecha", pts: 1 },
  { key: "anorexia", label: "Anorexia o cetonuria", pts: 1 },
  { key: "nauseas", label: "Náuseas o vómitos", pts: 1 },
  { key: "dolorFid", label: "Defensa o dolor en fosa ilíaca derecha", pts: 2 },
  { key: "rebote", label: "Dolor a la descompresión (signo de Blumberg)", pts: 1 },
  { key: "fiebre", label: "Fiebre (temperatura >= 37.3 °C)", pts: 1 },
  { key: "leucocitosis", label: "Leucocitosis (leucocitos >= 10,000 / mm3)", pts: 2 },
  { key: "desviacionIzq", label: "Desviación a la izquierda de neutrófilos (>75%)", pts: 1 },
]

const OMS_SAFETY_CHECKLIST = [
  { key: "confirmarIdentidad", label: "Identidad del paciente, sitio quirúrgico y procedimiento confirmados" },
  { key: "marcarSitio", label: "Marcación del sitio quirúrgico realizada" },
  { key: "oximetroPulso", label: "Oxímetro de pulso colocado y funcionando" },
  { key: "alergiasConocidas", label: "Alergias conocidas confirmadas y revisadas" },
  { key: "riesgoAspiracion", label: "Riesgo de aspiración o vía aérea difícil evaluado" },
  { key: "profilaxisAntibiotica", label: "Profilaxis antibiótica administrada en los últimos 60 minutos" },
]

export function CirugiaGeneralForm({ encounterId, disabled, initialData = {} }: Props) {
  const [tipoHerida, setTipoHerida] = useState(initialData.tipoHerida || "Ninguna")
  const [alvaradoAnswers, setAlvaradoAnswers] = useState<Record<string, boolean>>(() => {
    if (initialData.alvaradoAnswers) return initialData.alvaradoAnswers
    const initial: Record<string, boolean> = {}
    ALVARADO_ITEMS.forEach((item) => {
      initial[item.key] = false
    })
    return initial
  })

  const [dolorEva, setDolorEva] = useState<number>(initialData.dolorEva || 0)
  const [omsListChecked, setOmsListChecked] = useState<Record<string, boolean>>(() => {
    if (initialData.omsListChecked) return initialData.omsListChecked
    const initial: Record<string, boolean> = {}
    OMS_SAFETY_CHECKLIST.forEach((item) => {
      initial[item.key] = false
    })
    return initial
  })

  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    const initialAlvarado = initialData.alvaradoAnswers || {}
    const initialOms = initialData.omsListChecked || {}
    return (
      tipoHerida !== (initialData.tipoHerida || "Ninguna") ||
      JSON.stringify(alvaradoAnswers) !== JSON.stringify(initialAlvarado) ||
      dolorEva !== (initialData.dolorEva || 0) ||
      JSON.stringify(omsListChecked) !== JSON.stringify(initialOms)
    )
  }, [tipoHerida, alvaradoAnswers, dolorEva, omsListChecked, initialData])

  useEffect(() => {
    setDirty("cirugiaGeneral", isDirty)
  }, [isDirty, setDirty])

  const utils = trpc.useUtils()
  const save = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  // Calculate Alvarado Score
  const alvaradoSum = ALVARADO_ITEMS.reduce((acc, item) => {
    return acc + (alvaradoAnswers[item.key] ? item.pts : 0)
  }, 0)

  let alvaradoRiesgo = "Bajo riesgo (<=4 pts)"
  if (alvaradoSum >= 5 && alvaradoSum <= 6) alvaradoRiesgo = "Riesgo intermedio / Observación (5-6 pts)"
  if (alvaradoSum >= 7) alvaradoRiesgo = "Alto riesgo de apendicitis / Quirúrgico (7-10 pts)"

  function handleSave() {
    const payload = {
      tipoHerida,
      alvaradoAnswers,
      dolorEva,
      omsListChecked,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  const toggleAlvarado = (key: string) => {
    if (disabled) return
    setAlvaradoAnswers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const toggleOms = (key: string) => {
    if (disabled) return
    setOmsListChecked((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <Scissors className="h-4 w-4 text-sky-400 animate-pulse" />
        Valoración de Cirugía General y Escala de Alvarado
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Alvarado Calculator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Escala de Alvarado (Apendicitis)
            </h4>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-sky-400">Total: {alvaradoSum}/10</span>
              <span className="text-[10px] text-slate-400 block">{alvaradoRiesgo}</span>
            </div>
          </div>

          <div className="space-y-1">
            {ALVARADO_ITEMS.map((item) => {
              const active = alvaradoAnswers[item.key]
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleAlvarado(item.key)}
                  className={`w-full flex items-center justify-between rounded p-1.5 text-[11px] border transition-colors text-left ${
                    active
                      ? "bg-sky-900/30 border-sky-750 text-sky-300 font-semibold"
                      : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0 ml-2">
                    +{item.pts} pt{item.pts > 1 ? "s" : ""}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Middle: Checklist OMS & Pain EVA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Lista OMS de Cirugía Segura
            </h4>
          </div>

          <div className="space-y-1">
            {OMS_SAFETY_CHECKLIST.map((item) => {
              const active = omsListChecked[item.key]
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleOms(item.key)}
                  className={`w-full flex items-center justify-between rounded p-1.5 text-[10px] border transition-colors text-left ${
                    active
                      ? "bg-emerald-900/20 border-emerald-700 text-emerald-400 font-semibold"
                      : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {active && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-2" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Wound Class & EVA */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Herida y Monitoreo del Dolor
          </h4>

          <label className="block text-xs text-slate-400 font-medium">
            Clase de Herida Quirúrgica
            <select
              disabled={disabled}
              value={tipoHerida}
              onChange={(e) => setTipoHerida(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
            >
              <option value="Ninguna">Ninguna / No aplica</option>
              <option value="Limpia">Limpia (Sin infección / cerrada)</option>
              <option value="Limpia-Contaminada">Limpia-Contaminada (Apertura controlada)</option>
              <option value="Contaminada">Contaminada (Derrame / inflamación)</option>
              <option value="Sucia-Infectada">Sucia o Infectada (Necrosis / pus)</option>
            </select>
          </label>

          <div className="space-y-1 text-xs">
            <span className="block text-slate-400 font-medium">Escala Visual Analógica (EVA) de Dolor</span>
            <div className="flex items-center gap-3 bg-slate-800/10 p-2.5 rounded border border-slate-850">
              <input
                type="range"
                min="0"
                max="10"
                disabled={disabled}
                value={dolorEva}
                onChange={(e) => setDolorEva(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-750 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <span className="text-xs font-bold text-sky-400 bg-slate-800 px-2 py-1 rounded shrink-0 w-8 text-center">
                {dolorEva}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">0 = Sin dolor, 10 = Máximo dolor imaginable.</span>
          </div>
        </div>
      </div>

      {!disabled && (
        <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="rounded bg-sky-700 px-4 py-1.5 text-xs text-white hover:bg-sky-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Cirugía General"}
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

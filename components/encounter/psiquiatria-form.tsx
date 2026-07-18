"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Brain, CheckCircle, AlertTriangle } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    mse?: {
      apariencia?: string
      lenguaje?: string
      afecto?: string
      pensamiento?: string
      percepcion?: string
      juicio?: string
    }
    phq9?: number
    gad7?: number
    riesgo?: {
      suicida?: boolean
      agresion?: boolean
    }
  }
}

const MSE_OPTIONS = {
  apariencia: ["Adecuada", "Descuidada", "Extravagante", "Desaliñada", "Agitado", "Letárgico"],
  lenguaje: ["Fluido/Normal", "Verborreico", "Bradilalia", "Mutismo", "Disartria"],
  afecto: ["Eutímico", "Deprimido", "Ansioso", "Aplanado", "Irritable", "Lábil", "Inapropiado"],
  pensamiento: ["Lógico/Coherente", "Fuga de ideas", "Bloqueos", "Delirante", "Obsesivo"],
  percepcion: ["Sin alteraciones", "Alucinaciones auditivas", "Alucinaciones visuales", "Desrealización"],
  juicio: ["Adecuado", "Pobre", "Nulo", "Ausente (Psicosis)"],
}

export function PsiquiatriaForm({ encounterId, disabled, initialData = {} }: Props) {
  const m = initialData.mse || {}
  const r = initialData.riesgo || {}

  const [mse, setMse] = useState({
    apariencia: m.apariencia || "",
    lenguaje: m.lenguaje || "",
    afecto: m.afecto || "",
    pensamiento: m.pensamiento || "",
    percepcion: m.percepcion || "",
    juicio: m.juicio || "",
  })

  const [phq9, setPhq9] = useState<number>(initialData.phq9 || 0)
  const [gad7, setGad7] = useState<number>(initialData.gad7 || 0)

  const [riesgo, setRiesgo] = useState({
    suicida: r.suicida || false,
    agresion: r.agresion || false,
  })

  const [saved, setSaved] = useState(false)
  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(mse) !== JSON.stringify({
        apariencia: m.apariencia || "",
        lenguaje: m.lenguaje || "",
        afecto: m.afecto || "",
        pensamiento: m.pensamiento || "",
        percepcion: m.percepcion || "",
        juicio: m.juicio || "",
      }) ||
      phq9 !== (initialData.phq9 || 0) ||
      gad7 !== (initialData.gad7 || 0) ||
      JSON.stringify(riesgo) !== JSON.stringify({
        suicida: r.suicida || false,
        agresion: r.agresion || false,
      })
    )
  }, [mse, phq9, gad7, riesgo, m, r, initialData])

  useEffect(() => {
    setDirty("psiquiatria", isDirty)
  }, [isDirty, setDirty])

  const utils = trpc.useUtils()
  const save = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  function handleSave() {
    const payload = {
      mse,
      phq9,
      gad7,
      riesgo,
    }
    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  const toggleMse = (category: keyof typeof mse, option: string) => {
    if (disabled) return
    setMse((prev) => ({
      ...prev,
      [category]: prev[category] === option ? "" : option,
    }))
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="flex items-center gap-2 font-medium text-slate-200">
          <Brain className="h-4 w-4 text-purple-400" />
          Examen Mental y Escalas (Psiquiatría)
        </h3>
        <button
          onClick={handleSave}
          disabled={disabled || save.isPending || !isDirty}
          className="flex h-8 items-center gap-2 rounded-md bg-purple-600 px-3 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" /> Guardado
            </>
          ) : (
            "Guardar Evaluación"
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 border-r border-slate-800 pr-4">
          <h4 className="text-sm font-medium text-slate-300">Examen Mental Estructurado (MSE)</h4>
          {Object.entries(MSE_OPTIONS).map(([category, options]) => (
            <div key={category} className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 capitalize">{category}</label>
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => {
                  const isSelected = mse[category as keyof typeof mse] === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleMse(category as keyof typeof mse, opt)}
                      disabled={disabled}
                      className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                        isSelected
                          ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Escalas Clínicas Rápida</h4>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400">PHQ-9 (Depresión)</label>
                <span className="text-xs font-bold text-slate-300">{phq9} / 27</span>
              </div>
              <input
                type="range"
                min="0"
                max="27"
                value={phq9}
                onChange={(e) => setPhq9(Number(e.target.value))}
                disabled={disabled}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 (Mínima)</span>
                <span>10 (Moderada)</span>
                <span>27 (Severa)</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400">GAD-7 (Ansiedad)</label>
                <span className="text-xs font-bold text-slate-300">{gad7} / 21</span>
              </div>
              <input
                type="range"
                min="0"
                max="21"
                value={gad7}
                onChange={(e) => setGad7(Number(e.target.value))}
                disabled={disabled}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 (Mínima)</span>
                <span>10 (Moderada)</span>
                <span>21 (Severa)</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Evaluación de Riesgo
            </h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riesgo.suicida}
                  onChange={(e) => setRiesgo((prev) => ({ ...prev, suicida: e.target.checked }))}
                  disabled={disabled}
                  className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500/20"
                />
                <span className={`text-sm ${riesgo.suicida ? "text-red-400 font-medium" : "text-slate-300"}`}>
                  Riesgo Suicida
                </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riesgo.agresion}
                  onChange={(e) => setRiesgo((prev) => ({ ...prev, agresion: e.target.checked }))}
                  disabled={disabled}
                  className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-orange-500/20"
                />
                <span className={`text-sm ${riesgo.agresion ? "text-orange-400 font-medium" : "text-slate-300"}`}>
                  Riesgo de Agresión
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

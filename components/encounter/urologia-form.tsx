"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, CheckCircle, Database } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    ipssAnswers?: Record<number, number>
    ipssQol?: number
    psaTotal?: number
    psaLibre?: number
    volumenResiduo?: number
    tactoRectal?: string
    uroQmax?: number
    uroQmed?: number
    uroVol?: number
    uroTiempo?: number
  }
}

const IPSS_QUESTIONS: Record<number, string> = {
  1: "Vaciado incompleto (sensación de no vaciar bien la vejiga)",
  2: "Frecuencia (necesidad de volver a orinar antes de 2 horas)",
  3: "Intermitencia (parar y comenzar varias veces durante la micción)",
  4: "Urgencia (dificultad para aguantar las ganas de orinar)",
  5: "Chorro débil (fuerza del chorro miccional reducida)",
  6: "Esfuerzo (necesidad de empujar o hacer fuerza para comenzar)",
  7: "Nocturia (veces promedio que se levanta a orinar por la noche)",
}

export function UrologiaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [ipssAnswers, setIpssAnswers] = useState<Record<number, number>>(() => {
    if (initialData.ipssAnswers) return initialData.ipssAnswers
    const initial: Record<number, number> = {}
    for (let i = 1; i <= 7; i++) initial[i] = 0
    return initial
  })
  const [ipssQol, setIpssQol] = useState<number>(initialData.ipssQol || 0)
  const [psaTotal, setPsaTotal] = useState<string>(initialData.psaTotal?.toString() || "")
  const [psaLibre, setPsaLibre] = useState<string>(initialData.psaLibre?.toString() || "")
  const [volumenResiduo, setVolumenResiduo] = useState<string>(initialData.volumenResiduo?.toString() || "")
  const [tactoRectal, setTactoRectal] = useState(initialData.tactoRectal || "Normal")

  // Uroflowmetry
  const [uroQmax, setUroQmax] = useState<string>(initialData.uroQmax?.toString() || "")
  const [uroQmed, setUroQmed] = useState<string>(initialData.uroQmed?.toString() || "")
  const [uroVol, setUroVol] = useState<string>(initialData.uroVol?.toString() || "")
  const [uroTiempo, setUroTiempo] = useState<string>(initialData.uroTiempo?.toString() || "")

  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    const initialAnswers = initialData.ipssAnswers || { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0 }
    return (
      JSON.stringify(ipssAnswers) !== JSON.stringify(initialAnswers) ||
      ipssQol !== (initialData.ipssQol || 0) ||
      psaTotal !== (initialData.psaTotal?.toString() || "") ||
      psaLibre !== (initialData.psaLibre?.toString() || "") ||
      volumenResiduo !== (initialData.volumenResiduo?.toString() || "") ||
      tactoRectal !== (initialData.tactoRectal || "Normal") ||
      uroQmax !== (initialData.uroQmax?.toString() || "") ||
      uroQmed !== (initialData.uroQmed?.toString() || "") ||
      uroVol !== (initialData.uroVol?.toString() || "") ||
      uroTiempo !== (initialData.uroTiempo?.toString() || "")
    )
  }, [
    ipssAnswers, ipssQol, psaTotal, psaLibre, volumenResiduo, tactoRectal, 
    uroQmax, uroQmed, uroVol, uroTiempo, initialData
  ])

  useEffect(() => {
    setDirty("urologia", isDirty)
  }, [isDirty, setDirty])

  const utils = trpc.useUtils()
  const save = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const ipssSum = Object.values(ipssAnswers).reduce((acc, val) => acc + (val || 0), 0)
  let ipssSeverity = "Leve (0-7)"
  if (ipssSum >= 8 && ipssSum <= 19) ipssSeverity = "Moderado (8-19)"
  if (ipssSum >= 20) ipssSeverity = "Severo (20-35)"

  function handleSave() {
    const payload = {
      ipssAnswers,
      ipssQol,
      psaTotal: psaTotal ? Number(psaTotal) : undefined,
      psaLibre: psaLibre ? Number(psaLibre) : undefined,
      volumenResiduo: volumenResiduo ? Number(volumenResiduo) : undefined,
      tactoRectal,
      uroQmax: uroQmax ? Number(uroQmax) : undefined,
      uroQmed: uroQmed ? Number(uroQmed) : undefined,
      uroVol: uroVol ? Number(uroVol) : undefined,
      uroTiempo: uroTiempo ? Number(uroTiempo) : undefined,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <Database className="h-4 w-4 text-blue-400" />
        Evaluación Urológica y Score IPSS
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: IPSS Questionnaire */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Puntuación Internacional de Síntomas Prostáticos (IPSS)
            </h4>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-blue-400">Score: {ipssSum}</span>
              <span className="text-[10px] text-slate-400 block">{ipssSeverity}</span>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {Object.keys(IPSS_QUESTIONS).map((key) => {
              const qId = Number(key)
              return (
                <div key={qId} className="flex flex-col gap-1.5 p-2 bg-slate-800/10 rounded border border-slate-800/50 text-xs">
                  <span className="text-slate-300 font-medium">{qId}. {IPSS_QUESTIONS[qId]}</span>
                  <div className="flex gap-1">
                    {["Ninguna (0)", "1/5 veces (1)", "< la mitad (2)", "la mitad (3)", "> la mitad (4)", "Siempre (5)"].map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={disabled}
                        onClick={() => setIpssAnswers((prev) => ({ ...prev, [qId]: idx }))}
                        className={`rounded px-1.5 py-0.5 text-[9px] border transition-colors flex-1 text-center ${
                          ipssAnswers[qId] === idx
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

            <div className="flex flex-col gap-1.5 p-2 bg-slate-800/10 rounded border border-slate-800/50 text-xs">
              <span className="text-slate-300 font-medium">Calidad de Vida debido a Síntomas Urinarios</span>
              <select
                disabled={disabled}
                value={ipssQol}
                onChange={(e) => setIpssQol(Number(e.target.value))}
                className="block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white text-xs"
              >
                <option value={0}>0 - Encantado</option>
                <option value={1}>1 - Muy satisfecho</option>
                <option value={2}>2 - Mayormente satisfecho</option>
                <option value={3}>3 - Mezcla de sentimientos</option>
                <option value={4}>4 - Mayormente insatisfecho</option>
                <option value={5}>5 - Infeliz</option>
                <option value={6}>6 - Terrible</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: PSA, Uroflowmetry and Prostate Exam */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Marcadores y Examen Físico
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="block text-slate-400">
              Antígeno Prostático Total (PSA)
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.01"
                  disabled={disabled}
                  placeholder="2.5"
                  value={psaTotal}
                  onChange={(e) => setPsaTotal(e.target.value)}
                  className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-12 py-1.5 text-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">ng/mL</span>
              </div>
            </label>

            <label className="block text-slate-400">
              PSA Libre (Opcional)
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.01"
                  disabled={disabled}
                  placeholder="0.5"
                  value={psaLibre}
                  onChange={(e) => setPsaLibre(e.target.value)}
                  className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-12 py-1.5 text-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">ng/mL</span>
              </div>
            </label>

            <label className="block text-slate-400 col-span-2">
              Volumen de Residuo Post-Miccional
              <div className="relative mt-1">
                <input
                  type="number"
                  disabled={disabled}
                  placeholder="20"
                  value={volumenResiduo}
                  onChange={(e) => setVolumenResiduo(e.target.value)}
                  className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1.5 text-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">cc</span>
              </div>
            </label>
          </div>

          <label className="block text-xs text-slate-400 font-medium">
            Tacto Rectal (Examen Prostático)
            <select
              disabled={disabled}
              value={tactoRectal}
              onChange={(e) => setTactoRectal(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
            >
              <option value="Normal">Normal (Blanda, no dolorosa, sin nódulos)</option>
              <option value="Hipertrofia Benigna">Hipertrofia Prostática Benigna (Grado I-IV)</option>
              <option value="Nódulo Sospechoso">Nódulo sospechoso (Pétrea / Asimétrica)</option>
              <option value="Prostatitis">Prostatitis (Dolorosa al tacto / congestiva)</option>
            </select>
          </label>

          {/* Uroflowmetry fields */}
          <div className="rounded-lg border border-slate-800 bg-slate-800/10 p-3 space-y-2.5">
            <h5 className="text-xs font-semibold text-slate-350 uppercase tracking-wide">
              Estudio de Uroflujometría
            </h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="block text-slate-400">
                Flujo Máximo (Qmax)
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.1"
                    disabled={disabled}
                    placeholder="15"
                    value={uroQmax}
                    onChange={(e) => setUroQmax(e.target.value)}
                    className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-10 py-1 text-white"
                  />
                  <span className="absolute right-2 top-1.5 text-[9px] text-slate-500 font-semibold">mL/s</span>
                </div>
              </label>

              <label className="block text-slate-400">
                Flujo Medio (Qmed)
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.1"
                    disabled={disabled}
                    placeholder="8"
                    value={uroQmed}
                    onChange={(e) => setUroQmed(e.target.value)}
                    className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-10 py-1 text-white"
                  />
                  <span className="absolute right-2 top-1.5 text-[9px] text-slate-500 font-semibold">mL/s</span>
                </div>
              </label>

              <label className="block text-slate-400">
                Volumen Miccionado
                <div className="relative mt-1">
                  <input
                    type="number"
                    disabled={disabled}
                    placeholder="300"
                    value={uroVol}
                    onChange={(e) => setUroVol(e.target.value)}
                    className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1 text-white"
                  />
                  <span className="absolute right-2 top-1.5 text-[9px] text-slate-500 font-semibold">mL</span>
                </div>
              </label>

              <label className="block text-slate-400">
                Tiempo Miccional
                <div className="relative mt-1">
                  <input
                    type="number"
                    disabled={disabled}
                    placeholder="25"
                    value={uroTiempo}
                    onChange={(e) => setUroTiempo(e.target.value)}
                    className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1 text-white"
                  />
                  <span className="absolute right-2 top-1.5 text-[9px] text-slate-500 font-semibold">seg</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {!disabled && (
        <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="rounded bg-blue-700 px-4 py-1.5 text-xs text-white hover:bg-blue-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Urología"}
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

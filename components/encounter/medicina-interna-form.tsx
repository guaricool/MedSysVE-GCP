"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, CheckCircle, ShieldAlert } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    wellsAnswers?: Record<string, boolean>
    charlsonAnswers?: Record<string, boolean>
    edadDecada?: number
    creatinina?: number
    pacienteEdad?: number
    pacienteSexo?: string
    tfgeCalculada?: number
  }
}

const WELLS_CRITERIA = [
  { key: "cancer", label: "Cáncer activo (tratamiento en los últimos 6 meses o paliativo)", pts: 1 },
  { key: "paralisis", label: "Parálisis, paresia o inmovilización reciente con escayola de miembro inferior", pts: 1 },
  { key: "encamamiento", label: "Encamamiento reciente >3 días o cirugía mayor en las últimas 12 semanas", pts: 1 },
  { key: "dolorPunto", label: "Dolor localizado a lo largo del trayecto venoso profundo", pts: 1 },
  { key: "tumefaccionPierna", label: "Tumefacción de toda la pierna", pts: 1 },
  { key: "tumefaccionPantorrilla", label: "Aumento del perímetro de la pantorrilla >3 cm respecto a la otra", pts: 1 },
  { key: "edema", label: "Edema con fóvea (mayor en la pierna sintomática)", pts: 1 },
  { key: "venasColaterales", label: "Presencia de venas colaterales superficiales (no varicosas)", pts: 1 },
  { key: "diagnosticoAlternativo", label: "Diagnóstico alternativo tanto o más probable que la TVP", pts: -2 },
]

const CHARLSON_ITEMS = [
  { key: "infarto", label: "Infarto agudo de miocardio previo", pts: 1 },
  { key: "insuficienciaCardiaca", label: "Insuficiencia cardíaca congestiva", pts: 1 },
  { key: "arteriopatia", label: "Enfermedad arterial periférica", pts: 1 },
  { key: "cerebrovascular", label: "Enfermedad cerebrovascular o hemi/paraplejia", pts: 1 },
  { key: "demencia", label: "Demencia", pts: 1 },
  { key: "pulmonarCronica", label: "Enfermedad pulmonar crónica (EPOC/Asma)", pts: 1 },
  { key: "conectivopatia", label: "Conectivopatía / Enfermedad reumatológica", pts: 1 },
  { key: "ulcera", label: "Enfermedad ulcerosa péptica", pts: 1 },
  { key: "hepatopatiaLeve", label: "Hepatopatía leve", pts: 1 },
  { key: "diabetesSinOrgano", label: "Diabetes sin daño de órgano blanco", pts: 1 },
  { key: "diabetesConOrgano", label: "Diabetes con daño de órgano blanco", pts: 2 },
  { key: "nefropatia", label: "Enfermedad renal moderada o severa", pts: 2 },
  { key: "leucemia", label: "Leucemia o Linfoma", pts: 2 },
  { key: "tumorSolido", label: "Tumor sólido sin metástasis", pts: 2 },
  { key: "hepatopatiaModerada", label: "Hepatopatía moderada o severa (Cirrosis)", pts: 3 },
  { key: "tumorMetastasis", label: "Tumor sólido metastásico", pts: 6 },
  { key: "sida", label: "SIDA / VIH sintomático", pts: 6 },
]

export function MedicinaInternaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [wellsAnswers, setWellsAnswers] = useState<Record<string, boolean>>(() => {
    if (initialData.wellsAnswers) return initialData.wellsAnswers
    const initial: Record<string, boolean> = {}
    WELLS_CRITERIA.forEach((item) => {
      initial[item.key] = false
    })
    return initial
  })

  const [charlsonAnswers, setCharlsonAnswers] = useState<Record<string, boolean>>(() => {
    if (initialData.charlsonAnswers) return initialData.charlsonAnswers
    const initial: Record<string, boolean> = {}
    CHARLSON_ITEMS.forEach((item) => {
      initial[item.key] = false
    })
    return initial
  })

  const [edadDecada, setEdadDecada] = useState<number>(initialData.edadDecada || 0)

  // GFR parameters
  const [creatinina, setCreatinina] = useState<string>(initialData.creatinina?.toString() || "")
  const [pacienteEdad, setPacienteEdad] = useState<string>(initialData.pacienteEdad?.toString() || "60")
  const [pacienteSexo, setPacienteSexo] = useState(initialData.pacienteSexo || "Femenino")

  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    const initialWells = initialData.wellsAnswers || {}
    const initialCharlson = initialData.charlsonAnswers || {}
    
    // Ensure all keys are checked, or simplify with JSON.stringify if order is guaranteed, 
    // but since we initialize them with all keys, JSON.stringify should be safe.
    
    return (
      JSON.stringify(wellsAnswers) !== JSON.stringify(initialWells) ||
      JSON.stringify(charlsonAnswers) !== JSON.stringify(initialCharlson) ||
      edadDecada !== (initialData.edadDecada || 0) ||
      creatinina !== (initialData.creatinina?.toString() || "") ||
      pacienteEdad !== (initialData.pacienteEdad?.toString() || "60") ||
      pacienteSexo !== (initialData.pacienteSexo || "Femenino")
    )
  }, [
    wellsAnswers, charlsonAnswers, edadDecada, creatinina, pacienteEdad, pacienteSexo, initialData
  ])

  useEffect(() => {
    setDirty("medicinaInterna", isDirty)
  }, [isDirty, setDirty])

  const utils = trpc.useUtils()
  const save = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  // Calculate Wells Score
  const wellsSum = WELLS_CRITERIA.reduce((acc, item) => {
    return acc + (wellsAnswers[item.key] ? item.pts : 0)
  }, 0)

  let wellsProbabilidad = "Baja probabilidad (<5%)"
  if (wellsSum >= 1 && wellsSum <= 2) wellsProbabilidad = "Probabilidad moderada (17%)"
  if (wellsSum >= 3) wellsProbabilidad = "Alta probabilidad (17% a 53% - Requiere Eco Doppler)"

  // Calculate Charlson
  const charlsonComorbilidades = CHARLSON_ITEMS.reduce((acc, item) => {
    return acc + (charlsonAnswers[item.key] ? item.pts : 0)
  }, 0)
  const charlsonTotal = charlsonComorbilidades + edadDecada
  const survivalProb = parseFloat((Math.pow(0.983, Math.exp(charlsonTotal * 0.9)) * 100).toFixed(1))

  // Calculate GFR (CKD-EPI 2021)
  const scr = Number(creatinina)
  const ageVal = Number(pacienteEdad)
  let gfr = 0
  let gfrStage = "Sin calcular"

  if (scr > 0 && ageVal > 0) {
    const isFemale = pacienteSexo === "Femenino"
    const kappa = isFemale ? 0.7 : 0.9
    const alpha = isFemale ? -0.241 : -0.302
    const sexFactor = isFemale ? 1.012 : 1.0

    const minRatio = Math.min(scr / kappa, 1)
    const maxRatio = Math.max(scr / kappa, 1)

    gfr = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, ageVal) * sexFactor
    gfr = parseFloat(gfr.toFixed(1))

    if (gfr >= 90) gfrStage = "Estadio G1 (Normal o elevado)"
    else if (gfr >= 60) gfrStage = "Estadio G2 (Ligeramente disminuido)"
    else if (gfr >= 45) gfrStage = "Estadio G3a (Disminución ligera a moderada)"
    else if (gfr >= 30) gfrStage = "Estadio G3b (Disminución moderada a grave)"
    else if (gfr >= 15) gfrStage = "Estadio G4 (Disminución grave)"
    else gfrStage = "Estadio G5 (Fallo renal / Uremia)"
  }

  function handleSave() {
    const payload = {
      wellsAnswers,
      charlsonAnswers,
      edadDecada,
      creatinina: creatinina ? Number(creatinina) : undefined,
      pacienteEdad: pacienteEdad ? Number(pacienteEdad) : undefined,
      pacienteSexo,
      tfgeCalculada: gfr > 0 ? gfr : undefined,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  const toggleWells = (key: string) => {
    if (disabled) return
    setWellsAnswers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleCharlson = (key: string) => {
    if (disabled) return
    setCharlsonAnswers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const [activeTab, setActiveTab] = useState<"WELLS" | "CHARLSON" | "RENAL">("WELLS")

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white mr-auto">
          <ShieldAlert className="h-4 w-4 text-indigo-400" />
          Valoración de Medicina Interna y Comorbilidades
        </h3>
        
        {/* Navigation Tabs */}
        <button
          type="button"
          onClick={() => setActiveTab("WELLS")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "WELLS" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Criterios de Wells
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CHARLSON")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "CHARLSON" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Índice de Charlson
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("RENAL")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "RENAL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Función Renal
        </button>
      </div>

      {activeTab === "WELLS" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Criterios de Wells (Probabilidad de TVP)
            </h4>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-indigo-400">Puntaje: {wellsSum}</span>
              <span className="text-[10px] text-slate-400 block">{wellsProbabilidad}</span>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
            {WELLS_CRITERIA.map((item) => {
              const active = wellsAnswers[item.key]
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleWells(item.key)}
                  className={`w-full flex items-center justify-between rounded p-2 text-xs border transition-colors text-left ${
                    active
                      ? "bg-indigo-900/30 border-indigo-750 text-indigo-300 font-semibold"
                      : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0 ml-2">
                    {item.pts > 0 ? `+${item.pts}` : item.pts} pt{Math.abs(item.pts) > 1 ? "s" : ""}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === "CHARLSON" && (
        <div className="space-y-3">
          {/* Middle: Charlson Comorbidity Index */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Índice de Comorbilidad de Charlson (CCI)
            </h4>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-indigo-400">Total: {charlsonTotal}</span>
              <span className="text-[10px] text-slate-400 block">Supervivencia a 10 años: {survivalProb}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <label className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
              <span>Puntaje por Edad</span>
              <select
                disabled={disabled}
                value={edadDecada}
                onChange={(e) => setEdadDecada(Number(e.target.value))}
                className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-white w-32"
              >
                <option value={0}>&lt;50 años (0 pts)</option>
                <option value={1}>50-59 años (1 pt)</option>
                <option value={2}>60-69 años (2 pts)</option>
                <option value={3}>70-79 años (3 pts)</option>
                <option value={4}>&gt;=80 años (4 pts)</option>
              </select>
            </label>

            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
              {CHARLSON_ITEMS.map((item) => {
                const active = charlsonAnswers[item.key]
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleCharlson(item.key)}
                    className={`w-full flex items-center justify-between rounded p-2 text-[11px] border transition-colors text-left ${
                      active
                        ? "bg-indigo-900/30 border-indigo-750 text-indigo-300 font-semibold"
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
        </div>
      )}

      {activeTab === "RENAL" && (
        <div className="rounded-lg border border-slate-800 bg-slate-800/20 p-3 space-y-3">
          {/* Right: GFR Calculator (CKD-EPI 2021) */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Calculadora de Función Renal (CKD-EPI)
            </h4>
            {gfr > 0 && (
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-indigo-400">TFGe: {gfr}</span>
                <span className="text-[9px] text-slate-500 block">mL/min/1.73m²</span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <label className="block text-slate-400">
              Creatinina Sérica
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.01"
                  disabled={disabled}
                  placeholder="1.0"
                  value={creatinina}
                  onChange={(e) => setCreatinina(e.target.value)}
                  className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-12 py-1 text-white"
                />
                <span className="absolute right-2.5 top-1.5 text-[9px] text-slate-500 font-semibold">mg/dL</span>
              </div>
            </label>

            <label className="block text-slate-400">
              Edad del Paciente
              <input
                type="number"
                disabled={disabled}
                placeholder="60"
                value={pacienteEdad}
                onChange={(e) => setPacienteEdad(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              />
            </label>

            <label className="block text-slate-400">
              Sexo Biológico
              <select
                disabled={disabled}
                value={pacienteSexo}
                onChange={(e) => setPacienteSexo(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              >
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
              </select>
            </label>

            {gfr > 0 && (
              <div className="border-t border-slate-800 pt-2 text-[10px] font-semibold text-slate-300">
                Estadificación: <span className="text-indigo-400">{gfrStage}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!disabled && (
        <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="rounded bg-indigo-700 px-4 py-1.5 text-xs text-white hover:bg-indigo-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Medicina Interna"}
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

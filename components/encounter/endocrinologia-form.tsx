"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, CheckCircle, Flame, Percent, ShieldAlert, Award, Calendar } from "lucide-react"
import { LabTrendsChart } from "./lab-trends-chart"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  patientRegId: string
  disabled?: boolean
  initialData?: {
    hba1c?: number
    glucosaAyunas?: number
    glucosaPostprandial?: number
    insulinAyunas?: number
    tsh?: number
    t4Libre?: number
    t3Libre?: number
    puntosMonofilamento?: number
    pulsoPedio?: string
    pulsoTibial?: string
    colesterolTotal?: number
    colesterolHdl?: number
    trigliceridos?: number
    // CGM
    tir?: number
    gmi?: number
    variabilidadGlucemica?: number
    insulinaDosisDiaria?: number
    // Thyroid & Weight
    pesoPaciente?: number
    factorLevotiroxina?: number
    // Calcium & Bone
    calcioMedido?: number
    albuminaMedida?: number
    tScoreCadera?: number
    tScoreColumna?: number
    proximaDensitometriaMeses?: number
    // Annual checkups
    fondoOjoAnual?: string
    microalbuminuriaAnual?: string
    examenPiesAnual?: string
  }
}

export function EndocrinologiaForm({ encounterId, patientRegId, disabled, initialData = {} }: Props) {
  // Tabs
  const [activeTab, setActiveTab] = useState<"diabetes" | "tiroides" | "hueso" | "screening">("diabetes")

  // Diabetes states
  const [hba1c, setHba1c] = useState<string>(initialData.hba1c?.toString() || "")
  const [glucosaAyunas, setGlucosaAyunas] = useState<string>(initialData.glucosaAyunas?.toString() || "")
  const [glucosaPostprandial, setGlucosaPostprandial] = useState<string>(initialData.glucosaPostprandial?.toString() || "")
  const [insulinAyunas, setInsulinAyunas] = useState<string>(initialData.insulinAyunas?.toString() || "")
  const [tir, setTir] = useState<string>(initialData.tir?.toString() || "")
  const [gmi, setGmi] = useState<string>(initialData.gmi?.toString() || "")
  const [variabilidadGlucemica, setVariabilidadGlucemica] = useState<string>(initialData.variabilidadGlucemica?.toString() || "")
  const [insulinaDosisDiaria, setInsulinaDosisDiaria] = useState<string>(initialData.insulinaDosisDiaria?.toString() || "")

  // Thyroid states
  const [tsh, setTsh] = useState<string>(initialData.tsh?.toString() || "")
  const [t4Libre, setT4Libre] = useState<string>(initialData.t4Libre?.toString() || "")
  const [t3Libre, setT3Libre] = useState<string>(initialData.t3Libre?.toString() || "")
  const [pesoPaciente, setPesoPaciente] = useState<string>(initialData.pesoPaciente?.toString() || "")
  const [factorLevotiroxina, setFactorLevotiroxina] = useState<string>(initialData.factorLevotiroxina?.toString() || "1.6")

  // Bone & Calcium states
  const [calcioMedido, setCalcioMedido] = useState<string>(initialData.calcioMedido?.toString() || "")
  const [albuminaMedida, setAlbuminaMedida] = useState<string>(initialData.albuminaMedida?.toString() || "")
  const [tScoreCadera, setTScoreCadera] = useState<string>(initialData.tScoreCadera?.toString() || "")
  const [tScoreColumna, setTScoreColumna] = useState<string>(initialData.tScoreColumna?.toString() || "")
  const [proximaDensitometriaMeses, setProximaDensitometriaMeses] = useState<string>(initialData.proximaDensitometriaMeses?.toString() || "12")

  // Annual checkup states
  const [fondoOjoAnual, setFondoOjoAnual] = useState<string>(initialData.fondoOjoAnual || "pendiente")
  const [microalbuminuriaAnual, setMicroalbuminuriaAnual] = useState<string>(initialData.microalbuminuriaAnual || "pendiente")
  const [examenPiesAnual, setExamenPiesAnual] = useState<string>(initialData.examenPiesAnual || "pendiente")

  // Diabetic foot states
  const [puntosMonofilamento, setPuntosMonofilamento] = useState<number>(initialData.puntosMonofilamento ?? 10)
  const [pulsoPedio, setPulsoPedio] = useState(initialData.pulsoPedio || "Conservado")
  const [pulsoTibial, setPulsoTibial] = useState(initialData.pulsoTibial || "Conservado")

  // Lipid profile states (retained for backward compatibility and saving)
  const [colesterolTotal] = useState<string>(initialData.colesterolTotal?.toString() || "")
  const [colesterolHdl] = useState<string>(initialData.colesterolHdl?.toString() || "")
  const [trigliceridos] = useState<string>(initialData.trigliceridos?.toString() || "")

  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const payload = useMemo(() => ({
    hba1c: hba1c ? Number(hba1c) : undefined,
    glucosaAyunas: glucosaAyunas ? Number(glucosaAyunas) : undefined,
    glucosaPostprandial: glucosaPostprandial ? Number(glucosaPostprandial) : undefined,
    insulinAyunas: insulinAyunas ? Number(insulinAyunas) : undefined,
    tsh: tsh ? Number(tsh) : undefined,
    t4Libre: t4Libre ? Number(t4Libre) : undefined,
    t3Libre: t3Libre ? Number(t3Libre) : undefined,
    puntosMonofilamento,
    pulsoPedio,
    pulsoTibial,
    colesterolTotal: colesterolTotal ? Number(colesterolTotal) : undefined,
    colesterolHdl: colesterolHdl ? Number(colesterolHdl) : undefined,
    trigliceridos: trigliceridos ? Number(trigliceridos) : undefined,
    tir: tir ? Number(tir) : undefined,
    gmi: gmi ? Number(gmi) : undefined,
    variabilidadGlucemica: variabilidadGlucemica ? Number(variabilidadGlucemica) : undefined,
    insulinaDosisDiaria: insulinaDosisDiaria ? Number(insulinaDosisDiaria) : undefined,
    pesoPaciente: pesoPaciente ? Number(pesoPaciente) : undefined,
    factorLevotiroxina: factorLevotiroxina ? Number(factorLevotiroxina) : undefined,
    calcioMedido: calcioMedido ? Number(calcioMedido) : undefined,
    albuminaMedida: albuminaMedida ? Number(albuminaMedida) : undefined,
    tScoreCadera: tScoreCadera ? Number(tScoreCadera) : undefined,
    tScoreColumna: tScoreColumna ? Number(tScoreColumna) : undefined,
    proximaDensitometriaMeses: proximaDensitometriaMeses ? Number(proximaDensitometriaMeses) : undefined,
    fondoOjoAnual,
    microalbuminuriaAnual,
    examenPiesAnual,
  }), [
    hba1c, glucosaAyunas, glucosaPostprandial, insulinAyunas, tsh, t4Libre, t3Libre,
    puntosMonofilamento, pulsoPedio, pulsoTibial, colesterolTotal, colesterolHdl, trigliceridos,
    tir, gmi, variabilidadGlucemica, insulinaDosisDiaria, pesoPaciente, factorLevotiroxina,
    calcioMedido, albuminaMedida, tScoreCadera, tScoreColumna, proximaDensitometriaMeses,
    fondoOjoAnual, microalbuminuriaAnual, examenPiesAnual
  ])

  const isDirty = JSON.stringify(payload) !== JSON.stringify({
    ...payload,
    ...initialData
  })

  useEffect(() => {
    setDirty("endocrinologia", isDirty)
  }, [isDirty, setDirty])

  const utils = trpc.useUtils()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setDirty("endocrinologia", false)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  // Calculations:
  // 1. HOMA-IR: (Glucose * Insulin) / 405
  const glucoseVal = Number(glucosaAyunas)
  const insulinVal = Number(insulinAyunas)
  let homaIr: number | null = null
  let homaInterpretacion = ""
  if (glucoseVal > 0 && insulinVal > 0) {
    homaIr = parseFloat(((glucoseVal * insulinVal) / 405).toFixed(2))
    if (homaIr < 2.0) homaInterpretacion = "Normal"
    else if (homaIr <= 2.5) homaInterpretacion = "Resistencia limítrofe"
    else homaInterpretacion = "Resistencia establecida"
  }

  // 2. Insulin Sensitivity Factor (ISF) & Carb Ratio
  const tdd = Number(insulinaDosisDiaria)
  let isf1500: number | null = null
  let isf1800: number | null = null
  let ratio500: number | null = null
  if (tdd > 0) {
    isf1500 = parseFloat((1500 / tdd).toFixed(1))
    isf1800 = parseFloat((1800 / tdd).toFixed(1))
    ratio500 = parseFloat((500 / tdd).toFixed(1))
  }

  // 3. Levothyroxine full dose: Weight * Factor
  const weight = Number(pesoPaciente)
  const factorLevo = Number(factorLevotiroxina)
  let levoDose: number | null = null
  if (weight > 0 && factorLevo > 0) {
    levoDose = Math.round(weight * factorLevo)
  }

  // 4. Albumin-corrected Calcium
  const caVal = Number(calcioMedido)
  const albVal = Number(albuminaMedida)
  let correctedCa: number | null = null
  if (caVal > 0 && albVal > 0) {
    correctedCa = parseFloat((caVal + 0.8 * (4.0 - albVal)).toFixed(2))
  }

  function handleSave() {
    const payload = {
      hba1c: hba1c ? Number(hba1c) : undefined,
      glucosaAyunas: glucosaAyunas ? Number(glucosaAyunas) : undefined,
      glucosaPostprandial: glucosaPostprandial ? Number(glucosaPostprandial) : undefined,
      insulinAyunas: insulinAyunas ? Number(insulinAyunas) : undefined,
      tsh: tsh ? Number(tsh) : undefined,
      t4Libre: t4Libre ? Number(t4Libre) : undefined,
      t3Libre: t3Libre ? Number(t3Libre) : undefined,
      puntosMonofilamento,
      pulsoPedio,
      pulsoTibial,
      colesterolTotal: colesterolTotal ? Number(colesterolTotal) : undefined,
      colesterolHdl: colesterolHdl ? Number(colesterolHdl) : undefined,
      trigliceridos: trigliceridos ? Number(trigliceridos) : undefined,
      // CGM
      tir: tir ? Number(tir) : undefined,
      gmi: gmi ? Number(gmi) : undefined,
      variabilidadGlucemica: variabilidadGlucemica ? Number(variabilidadGlucemica) : undefined,
      insulinaDosisDiaria: insulinaDosisDiaria ? Number(insulinaDosisDiaria) : undefined,
      // Thyroid & Weight
      pesoPaciente: pesoPaciente ? Number(pesoPaciente) : undefined,
      factorLevotiroxina: factorLevotiroxina ? Number(factorLevotiroxina) : undefined,
      // Calcium & Bone
      calcioMedido: calcioMedido ? Number(calcioMedido) : undefined,
      albuminaMedida: albuminaMedida ? Number(albuminaMedida) : undefined,
      tScoreCadera: tScoreCadera ? Number(tScoreCadera) : undefined,
      tScoreColumna: tScoreColumna ? Number(tScoreColumna) : undefined,
      proximaDensitometriaMeses: proximaDensitometriaMeses ? Number(proximaDensitometriaMeses) : undefined,
      // Checkups
      fondoOjoAnual,
      microalbuminuriaAnual,
      examenPiesAnual,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white mr-auto">
          <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
          Evaluación de Endocrinología y Metabolismo
        </h3>
        
        {/* Navigation Tabs */}
        <button
          type="button"
          onClick={() => setActiveTab("diabetes")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "diabetes" ? "bg-orange-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Diabetes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tiroides")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "tiroides" ? "bg-orange-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Tiroides
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("hueso")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "hueso" ? "bg-orange-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Hueso
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("screening")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "screening" ? "bg-orange-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Screening Anual
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4 min-h-[300px]">
        {activeTab === "diabetes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Labs glucose */}
            <div className="space-y-3 bg-slate-800/10 p-3 rounded border border-slate-850">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-1 flex justify-between">
                <span>Laboratorios Glucídicos</span>
                {homaIr !== null && <span className="text-orange-400">HOMA-IR: {homaIr}</span>}
              </h4>
              <div className="space-y-2 text-xs">
                <label className="block text-slate-400">
                  Hemoglobina Glicosilada (HbA1c)
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.1"
                      disabled={disabled}
                      placeholder="6.5"
                      value={hba1c}
                      onChange={(e) => setHba1c(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-8 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">%</span>
                  </div>
                </label>

                <label className="block text-slate-400">
                  Glucosa en Ayunas
                  <div className="relative mt-1">
                    <input
                      type="number"
                      disabled={disabled}
                      placeholder="100"
                      value={glucosaAyunas}
                      onChange={(e) => setGlucosaAyunas(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-12 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">mg/dL</span>
                  </div>
                </label>

                <label className="block text-slate-400">
                  Glucosa Postprandial
                  <div className="relative mt-1">
                    <input
                      type="number"
                      disabled={disabled}
                      placeholder="140"
                      value={glucosaPostprandial}
                      onChange={(e) => setGlucosaPostprandial(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-12 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">mg/dL</span>
                  </div>
                </label>

                <label className="block text-slate-400">
                  Insulina Basal
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.1"
                      disabled={disabled}
                      placeholder="8.5"
                      value={insulinAyunas}
                      onChange={(e) => setInsulinAyunas(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-12 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">mIU/L</span>
                  </div>
                </label>

                {homaIr !== null && (
                  <p className="text-[10px] text-slate-450 italic mt-1">Interpretación: {homaInterpretacion}</p>
                )}
              </div>
            </div>

            {/* CGM Metrics */}
            <div className="space-y-3 bg-slate-800/10 p-3 rounded border border-slate-850">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-1">
                Monitoreo Continuo (MCG)
              </h4>
              <div className="space-y-2 text-xs">
                <label className="block text-slate-400">
                  Tiempo en Rango (TIR - 70-180 mg/dL)
                  <div className="relative mt-1">
                    <input
                      type="number"
                      disabled={disabled}
                      placeholder="70"
                      value={tir}
                      onChange={(e) => setTir(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-8 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">%</span>
                  </div>
                </label>

                <label className="block text-slate-400">
                  Glucose Management Indicator (GMI / HbA1c est.)
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.1"
                      disabled={disabled}
                      placeholder="6.8"
                      value={gmi}
                      onChange={(e) => setGmi(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-8 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">%</span>
                  </div>
                </label>

                <label className="block text-slate-400">
                  Variabilidad Glucémica (CV)
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.1"
                      disabled={disabled}
                      placeholder="36"
                      value={variabilidadGlucemica}
                      onChange={(e) => setVariabilidadGlucemica(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-8 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">%</span>
                  </div>
                </label>
                <span className="text-[10px] text-slate-500 mt-1 block">Meta clínica: TIR &gt; 70%, CV &lt; 36%.</span>
              </div>
            </div>

            {/* Insulin sensitivity calculator */}
            <div className="space-y-3 bg-slate-800/10 p-3 rounded border border-slate-850">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-1">
                Titulación & Ratios de Insulina
              </h4>
              <div className="space-y-3 text-xs">
                <label className="block text-slate-400">
                  Dosis Diaria Total de Insulina (TDD)
                  <div className="relative mt-1">
                    <input
                      type="number"
                      disabled={disabled}
                      placeholder="40"
                      value={insulinaDosisDiaria}
                      onChange={(e) => setInsulinaDosisDiaria(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-12 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">U/día</span>
                  </div>
                </label>

                {isf1500 !== null && isf1800 !== null && ratio500 !== null && (
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-400">Factor Sensibilidad (ISF):</span>
                      <span className="text-orange-400">{isf1800} (1800) / {isf1500} (1500) mg/dL por U</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-400">Ratio Carb/Insulina (CIR):</span>
                      <span className="text-orange-400">1 U por {ratio500} g HC</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Charts Row */}
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              <LabTrendsChart patientRegId={patientRegId} parameter="HbA1c" />
              <LabTrendsChart patientRegId={patientRegId} parameter="Glucosa" />
              <LabTrendsChart patientRegId={patientRegId} parameter="Insulina" />
            </div>
          </div>
        )}

        {activeTab === "tiroides" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Thyroid profile */}
            <div className="space-y-3 bg-slate-800/10 p-3 rounded border border-slate-850">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-1">
                Perfil Tiroideo
              </h4>
              <div className="space-y-2 text-xs">
                <label className="block text-slate-400">
                  Hormona Estimulante de Tiroides (TSH)
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.01"
                      disabled={disabled}
                      placeholder="2.5"
                      value={tsh}
                      onChange={(e) => setTsh(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-12 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">uIU/mL</span>
                  </div>
                </label>

                <label className="block text-slate-400">
                  T4 Libre
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.01"
                      disabled={disabled}
                      placeholder="1.2"
                      value={t4Libre}
                      onChange={(e) => setT4Libre(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-12 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">ng/dL</span>
                  </div>
                </label>

                <label className="block text-slate-400">
                  T3 Libre
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.01"
                      disabled={disabled}
                      placeholder="3.1"
                      value={t3Libre}
                      onChange={(e) => setT3Libre(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-12 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">pg/mL</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Levothyroxine calculator */}
            <div className="space-y-3 bg-slate-800/10 p-3 rounded border border-slate-850">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-1">
                Calculadora de Dosis de Levotiroxina
              </h4>
              <div className="space-y-3 text-xs">
                <label className="block text-slate-400">
                  Peso Corporal del Paciente
                  <div className="relative mt-1">
                    <input
                      type="number"
                      disabled={disabled}
                      placeholder="70"
                      value={pesoPaciente}
                      onChange={(e) => setPesoPaciente(e.target.value)}
                      className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-8 py-1.5 text-white"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">kg</span>
                  </div>
                </label>

                <label className="block text-slate-400">
                  Factor de Ajuste de Dosis
                  <select
                    disabled={disabled}
                    value={factorLevotiroxina}
                    onChange={(e) => setFactorLevotiroxina(e.target.value)}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-850 px-2 py-1.5 text-white"
                  >
                    <option value="1.6">1.6 mcg/kg (Adulto sano / Dosis plena)</option>
                    <option value="1.2">1.2 mcg/kg (Enfermedad cardíaca o anciano)</option>
                    <option value="1.0">1.0 mcg/kg (Hipotiroidismo subclínico)</option>
                  </select>
                </label>

                {levoDose !== null && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 block uppercase">Dosis Inicial Estimada</span>
                    <span className="text-lg font-bold text-orange-400">{levoDose} mcg/día</span>
                    <span className="text-[9px] text-slate-550 block">Redondear al valor de tableta disponible comercialmente.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thyroid Chart */}
            <div className="col-span-1 lg:col-span-2">
              <LabTrendsChart patientRegId={patientRegId} parameter="TSH" />
            </div>
          </div>
        )}

        {activeTab === "hueso" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Calcium corrected */}
            <div className="space-y-3 bg-slate-800/10 p-3 rounded border border-slate-850">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-1">
                Calcio Corregido por Albúmina
              </h4>
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-slate-400">
                    Calcio Medido
                    <div className="relative mt-1">
                      <input
                        type="number"
                        step="0.1"
                        disabled={disabled}
                        placeholder="8.5"
                        value={calcioMedido}
                        onChange={(e) => setCalcioMedido(e.target.value)}
                        className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-12 py-1.5 text-white"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">mg/dL</span>
                    </div>
                  </label>

                  <label className="block text-slate-400">
                    Albúmina Sérica
                    <div className="relative mt-1">
                      <input
                        type="number"
                        step="0.1"
                        disabled={disabled}
                        placeholder="3.5"
                        value={albuminaMedida}
                        onChange={(e) => setAlbuminaMedida(e.target.value)}
                        className="block w-full rounded border border-slate-700 bg-slate-850 pl-3 pr-10 py-1.5 text-white"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">g/dL</span>
                    </div>
                  </label>
                </div>

                {correctedCa !== null && (
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Calcio Corregido</span>
                    <span className="text-base font-bold text-orange-400">{correctedCa} mg/dL</span>
                  </div>
                )}
              </div>
            </div>

            {/* Osteoporosis */}
            <div className="space-y-3 bg-slate-800/10 p-3 rounded border border-slate-850">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-1">
                Densitometría Ósea (DXA)
              </h4>
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-slate-400">
                    T-score Cadera
                    <input
                      type="number"
                      step="0.1"
                      disabled={disabled}
                      placeholder="-2.5"
                      value={tScoreCadera}
                      onChange={(e) => setTScoreCadera(e.target.value)}
                      className="mt-1 block w-full rounded border border-slate-700 bg-slate-850 px-2 py-1.5 text-white"
                    />
                  </label>

                  <label className="block text-slate-400">
                    T-score Columna
                    <input
                      type="number"
                      step="0.1"
                      disabled={disabled}
                      placeholder="-1.8"
                      value={tScoreColumna}
                      onChange={(e) => setTScoreColumna(e.target.value)}
                      className="mt-1 block w-full rounded border border-slate-700 bg-slate-850 px-2 py-1.5 text-white"
                    />
                  </label>
                </div>

                <label className="block text-slate-400">
                  Próximo Control DXA
                  <select
                    disabled={disabled}
                    value={proximaDensitometriaMeses}
                    onChange={(e) => setProximaDensitometriaMeses(e.target.value)}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-850 px-2 py-1.5 text-white"
                  >
                    <option value="12">En 12 meses (1 año)</option>
                    <option value="24">En 24 meses (2 años)</option>
                    <option value="36">En 36 meses (3 años)</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "screening" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Diabetic annual checks */}
            <div className="space-y-3 bg-slate-800/10 p-3 rounded border border-slate-850">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-1">
                Semáforo de Cribado Diabético Anual
              </h4>
              <div className="space-y-3 text-xs">
                {/* eye check */}
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-850">
                  <div className="space-y-0.5">
                    <span className="block font-medium text-slate-300">Fondo de Ojo (Retinopatía)</span>
                    <span className="text-[10px] text-slate-500">Obligatorio una vez al año.</span>
                  </div>
                  <select
                    disabled={disabled}
                    value={fondoOjoAnual}
                    onChange={(e) => setFondoOjoAnual(e.target.value)}
                    className={`rounded border text-xs px-2 py-1 font-bold ${
                      fondoOjoAnual === "realizado"
                        ? "bg-emerald-950/40 border-emerald-700 text-emerald-400"
                        : "bg-red-950/40 border-red-700 text-red-400"
                    }`}
                  >
                    <option value="pendiente" className="bg-slate-950 text-red-400">🔴 Pendiente</option>
                    <option value="realizado" className="bg-slate-950 text-emerald-400">🟢 Realizado</option>
                  </select>
                </div>

                {/* microalbuminuria check */}
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-850">
                  <div className="space-y-0.5">
                    <span className="block font-medium text-slate-300">Microalbuminuria (Nefropatía)</span>
                    <span className="text-[10px] text-slate-500">Relación Albúmina/Creatinina en orina.</span>
                  </div>
                  <select
                    disabled={disabled}
                    value={microalbuminuriaAnual}
                    onChange={(e) => setMicroalbuminuriaAnual(e.target.value)}
                    className={`rounded border text-xs px-2 py-1 font-bold ${
                      microalbuminuriaAnual === "realizado"
                        ? "bg-emerald-950/40 border-emerald-700 text-emerald-400"
                        : "bg-red-950/40 border-red-700 text-red-400"
                    }`}
                  >
                    <option value="pendiente" className="bg-slate-950 text-red-400">🔴 Pendiente</option>
                    <option value="realizado" className="bg-slate-950 text-emerald-400">🟢 Realizado</option>
                  </select>
                </div>

                {/* foot exam check */}
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-850">
                  <div className="space-y-0.5">
                    <span className="block font-medium text-slate-300">Examen Completo de Pies (Neuropatía)</span>
                    <span className="text-[10px] text-slate-500">Inspección de pulsos y sensibilidad.</span>
                  </div>
                  <select
                    disabled={disabled}
                    value={examenPiesAnual}
                    onChange={(e) => setExamenPiesAnual(e.target.value)}
                    className={`rounded border text-xs px-2 py-1 font-bold ${
                      examenPiesAnual === "realizado"
                        ? "bg-emerald-950/40 border-emerald-700 text-emerald-400"
                        : "bg-red-950/40 border-red-700 text-red-400"
                    }`}
                  >
                    <option value="pendiente" className="bg-slate-950 text-red-400">🔴 Pendiente</option>
                    <option value="realizado" className="bg-slate-950 text-emerald-400">🟢 Realizado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Foot details */}
            <div className="space-y-3 bg-slate-800/10 p-3 rounded border border-slate-850">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-1">
                Detalles de Neuropatía y Pies
              </h4>
              <div className="space-y-2 text-xs">
                <label className="block text-slate-400">
                  Monofilamento de Semmes-Weinstein
                  <select
                    disabled={disabled}
                    value={puntosMonofilamento}
                    onChange={(e) => setPuntosMonofilamento(Number(e.target.value))}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-850 px-2 py-1.5 text-white"
                  >
                    <option value={10}>10/10 puntos (Sensibilidad Conservada)</option>
                    <option value={8}>8/10 puntos</option>
                    <option value={5}>5/10 puntos (Pérdida moderada)</option>
                    <option value={1}>1/10 puntos (Pérdida severa)</option>
                    <option value={0}>0/10 puntos (Anestesia distal)</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-slate-400">
                    Pulso Pedio
                    <select
                      disabled={disabled}
                      value={pulsoPedio}
                      onChange={(e) => setPulsoPedio(e.target.value)}
                      className="mt-1 block w-full rounded border border-slate-700 bg-slate-850 px-2 py-1.5 text-white"
                    >
                      <option value="Conservado">Conservado</option>
                      <option value="Disminuido">Disminuido</option>
                      <option value="Ausente">Ausente</option>
                    </select>
                  </label>

                  <label className="block text-slate-400">
                    Pulso Tibial Posterior
                    <select
                      disabled={disabled}
                      value={pulsoTibial}
                      onChange={(e) => setPulsoTibial(e.target.value)}
                      className="mt-1 block w-full rounded border border-slate-700 bg-slate-850 px-2 py-1.5 text-white"
                    >
                      <option value="Conservado">Conservado</option>
                      <option value="Disminuido">Disminuido</option>
                      <option value="Ausente">Ausente</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {!disabled && (
        <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="rounded bg-orange-700 px-4 py-1.5 text-xs text-white hover:bg-orange-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Endocrinología"}
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

"use client"

import { useMemo, useEffect, useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Baby, Activity, CheckCircle, TrendingUp, Calculator } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"
import { GrowthChart } from "@/components/patients/growth-chart"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    percentilPeso?: string
    percentilTalla?: string
    percentilCefalico?: string
    hitoMotorGrueso?: string
    hitoMotorFino?: string
    hitoLenguaje?: string
    hitoSocial?: string
    vacunasColocadas?: string[]
  }
}

const VACUNAS_PAI = [
  "BCG (Tuberculosis)",
  "Hepatitis B (Recién Nacido)",
  "Rotavirus (1ra y 2da dosis)",
  "Polio IPV/OPV (1ra, 2da, 3ra dosis)",
  "Pentavalente (DPT + HepB + Hib)",
  "Fiebre Amarilla",
  "Trivalente Viral (SRP: Sarampión, Rubéola, Paperas)",
  "Neumococo Conjugada",
  "Influenza Estacional",
]

export function PediatriaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [percentilPeso, setPercentilPeso] = useState(initialData.percentilPeso || "50")
  const [percentilTalla, setPercentilTalla] = useState(initialData.percentilTalla || "50")
  const [percentilCefalico, setPercentilCefalico] = useState(initialData.percentilCefalico || "50")
  const [hitoMotorGrueso, setHitoMotorGrueso] = useState(initialData.hitoMotorGrueso || "")
  const [hitoMotorFino, setHitoMotorFino] = useState(initialData.hitoMotorFino || "")
  const [hitoLenguaje, setHitoLenguaje] = useState(initialData.hitoLenguaje || "")
  const [hitoSocial, setHitoSocial] = useState(initialData.hitoSocial || "")
  const { data: enc } = (trpc.encounter.get.useQuery as any)({ id: encounterId })
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: vitals = [] } = (trpc as any).analytics?.patientVitals?.useQuery(
    { patientRegistrationId: enc?.patientRegistrationId },
    { enabled: !!enc?.patientRegistrationId }
  ) ?? { data: [] }

  const [dosisPeso, setDosisPeso] = useState(10)
  const [dosisMgKg, setDosisMgKg] = useState(15) // Acetaminophen default
  const [concentracionMg, setConcentracionMg] = useState(120) // 120mg / 5ml
  const [concentracionMl, setConcentracionMl] = useState(5)

  const [vacunasColocadas, setVacunasColocadas] = useState<string[]>(initialData.vacunasColocadas || [])
  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return (
      percentilPeso !== (initialData.percentilPeso || "50") ||
      percentilTalla !== (initialData.percentilTalla || "50") ||
      percentilCefalico !== (initialData.percentilCefalico || "50") ||
      hitoMotorGrueso !== (initialData.hitoMotorGrueso || "") ||
      hitoMotorFino !== (initialData.hitoMotorFino || "") ||
      hitoLenguaje !== (initialData.hitoLenguaje || "") ||
      hitoSocial !== (initialData.hitoSocial || "") ||
      JSON.stringify(vacunasColocadas) !== JSON.stringify(initialData.vacunasColocadas || [])
    )
  }, [
    percentilPeso,
    percentilTalla,
    percentilCefalico,
    hitoMotorGrueso,
    hitoMotorFino,
    hitoLenguaje,
    hitoSocial,
    vacunasColocadas,
    initialData,
  ])

  useEffect(() => {
    setDirty("pediatria", isDirty)
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
      percentilPeso,
      percentilTalla,
      percentilCefalico,
      hitoMotorGrueso,
      hitoMotorFino,
      hitoLenguaje,
      hitoSocial,
      vacunasColocadas,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  const toggleVacuna = (vacuna: string) => {
    if (disabled) return
    setVacunasColocadas((prev) =>
      prev.includes(vacuna) ? prev.filter((v) => v !== vacuna) : [...prev, vacuna]
    )
  }

  const [activeTab, setActiveTab] = useState<"CRECIMIENTO" | "DESARROLLO" | "VACUNAS">("CRECIMIENTO")

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white mr-auto">
          <Baby className="h-4 w-4 text-pink-400" />
          Evaluación Pediátrica y Desarrollo
        </h3>
        
        {/* Navigation Tabs */}
        <button
          type="button"
          onClick={() => setActiveTab("CRECIMIENTO")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "CRECIMIENTO" ? "bg-pink-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Crecimiento y Dosis
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("DESARROLLO")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "DESARROLLO" ? "bg-pink-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Desarrollo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("VACUNAS")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "VACUNAS" ? "bg-pink-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Vacunas
        </button>
      </div>

      {activeTab === "CRECIMIENTO" && (
        <div className="space-y-4">
          {/* Growth Percentiles */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Percentiles de Crecimiento
          </h4>
          <div className="space-y-3">
            <label className="block text-xs text-slate-400 font-medium">
              Percentil Peso para Edad
              <select
                disabled={disabled}
                value={percentilPeso}
                onChange={(e) => setPercentilPeso(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="<3">Bajo percentil (&lt;p3)</option>
                <option value="3">p3</option>
                <option value="15">p15</option>
                <option value="50">p50 (Promedio)</option>
                <option value="85">p85</option>
                <option value="97">p97</option>
                <option value=">97">Alto percentil (&gt;p97)</option>
              </select>
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Percentil Talla para Edad
              <select
                disabled={disabled}
                value={percentilTalla}
                onChange={(e) => setPercentilTalla(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="<3">Bajo percentil (&lt;p3)</option>
                <option value="3">p3</option>
                <option value="15">p15</option>
                <option value="50">p50 (Promedio)</option>
                <option value="85">p85</option>
                <option value="97">p97</option>
                <option value=">97">Alto percentil (&gt;p97)</option>
              </select>
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Percentil Perímetro Cefálico
              <select
                disabled={disabled}
                value={percentilCefalico}
                onChange={(e) => setPercentilCefalico(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="<3">Microcefalia (&lt;p3)</option>
                <option value="3">p3</option>
                <option value="15">p15</option>
                <option value="50">p50 (Promedio)</option>
                <option value="85">p85</option>
                <option value="97">p97</option>
                <option value=">97">Macrocefalia (&gt;p97)</option>
              </select>
            </label>
          </div>
        </div>
        </div>
      )}

      {activeTab === "DESARROLLO" && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-800 pb-2">
            Hitos del Desarrollo
          </h4>
          <div className="space-y-2">
            <label className="block text-xs text-slate-400 font-medium">
              Motor Grueso
              <input
                type="text"
                disabled={disabled}
                placeholder="Ej. Sostiene cabeza, gatea, camina..."
                value={hitoMotorGrueso}
                onChange={(e) => setHitoMotorGrueso(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
              />
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Motor Fino
              <input
                type="text"
                disabled={disabled}
                placeholder="Ej. Pinza digital, agarra cubos..."
                value={hitoMotorFino}
                onChange={(e) => setHitoMotorFino(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
              />
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Lenguaje
              <input
                type="text"
                disabled={disabled}
                placeholder="Ej. Balbuceo, monosílabos, frases..."
                value={hitoLenguaje}
                onChange={(e) => setHitoLenguaje(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
              />
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Social / Adaptativo
              <input
                type="text"
                disabled={disabled}
                placeholder="Ej. Sonrisa social, señala objetos..."
                value={hitoSocial}
                onChange={(e) => setHitoSocial(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
              />
            </label>
          </div>
        </div>
      )}

      {activeTab === "VACUNAS" && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-800 pb-2">
            Esquema de Vacunación (PAI)
          </h4>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {VACUNAS_PAI.map((vacuna) => {
              const active = vacunasColocadas.includes(vacuna)
              return (
                <button
                  key={vacuna}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleVacuna(vacuna)}
                  className={`w-full flex items-center justify-between rounded p-2 text-xs border transition-colors text-left ${
                    active
                      ? "bg-pink-900/30 border-pink-700 text-pink-300"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{vacuna}</span>
                  {active && <CheckCircle className="h-3.5 w-3.5 text-pink-400 shrink-0 ml-2" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Dosage Calculator & Growth Chart always visible or part of growth tab? Put it in Crecimiento tab */}
      {activeTab === "CRECIMIENTO" && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <Calculator className="h-4 w-4 text-emerald-400" />
            Calculadora de Dosis por Kg
          </h4>
          <div className="rounded border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="block text-xs text-slate-400">
                Peso del niño (kg)
                <input
                  type="number"
                  value={dosisPeso}
                  onChange={(e) => setDosisPeso(Number(e.target.value))}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
                />
              </label>
              <label className="block text-xs text-slate-400">
                Dosis (mg/kg)
                <input
                  type="number"
                  value={dosisMgKg}
                  onChange={(e) => setDosisMgKg(Number(e.target.value))}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
                />
              </label>
              <label className="block text-xs text-slate-400">
                Concentración (mg)
                <input
                  type="number"
                  value={concentracionMg}
                  onChange={(e) => setConcentracionMg(Number(e.target.value))}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
                />
              </label>
              <label className="block text-xs text-slate-400">
                Volumen (ml)
                <input
                  type="number"
                  value={concentracionMl}
                  onChange={(e) => setConcentracionMl(Number(e.target.value))}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
                />
              </label>
            </div>
            
            <div className="flex justify-between items-center bg-emerald-900/20 border border-emerald-900 rounded p-2 text-emerald-300">
              <span>Volumen a Administrar:</span>
              <span className="font-bold text-lg">
                {((dosisPeso * dosisMgKg) / (concentracionMg / concentracionMl)).toFixed(1)} ml
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <TrendingUp className="h-4 w-4 text-pink-400" />
            Curva de Crecimiento (OMS)
          </h4>
          <div className="rounded border border-slate-800 bg-slate-900 p-3 h-[250px]">
            {enc && vitals.length > 0 ? (
              <GrowthChart
                vitals={vitals}
                fechaNacimiento={enc.patientRegistration?.fechaNacimiento || new Date()}
                sexo={enc.patientRegistration?.sexo || "MASCULINO"}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No hay suficientes datos de peso registrados.
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {!disabled && (
        <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="rounded bg-pink-700 px-4 py-1.5 text-xs text-white hover:bg-pink-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Pediatría"}
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

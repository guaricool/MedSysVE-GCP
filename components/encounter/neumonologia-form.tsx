"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, CheckCircle } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    fev1?: number
    fvc?: number
    fev1FvcRatio?: number
    spo2?: number
    mmrcDyspnea?: string
    auscultacionPulmonar?: string
  }
}

export function NeumonologiaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [fev1, setFev1] = useState<string>(initialData.fev1?.toString() || "")
  const [fvc, setFvc] = useState<string>(initialData.fvc?.toString() || "")
  const [fev1FvcRatio, setFev1FvcRatio] = useState<string>(initialData.fev1FvcRatio?.toString() || "")
  const [spo2, setSpo2] = useState<string>(initialData.spo2?.toString() || "")
  const [mmrcDyspnea, setMmrcDyspnea] = useState(initialData.mmrcDyspnea || "Grado 0")
  const [auscultacionPulmonar, setAuscultacionPulmonar] = useState(initialData.auscultacionPulmonar || "")
  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return (
      fev1 !== (initialData.fev1?.toString() || "") ||
      fvc !== (initialData.fvc?.toString() || "") ||
      fev1FvcRatio !== (initialData.fev1FvcRatio?.toString() || "") ||
      spo2 !== (initialData.spo2?.toString() || "") ||
      mmrcDyspnea !== (initialData.mmrcDyspnea || "Grado 0") ||
      auscultacionPulmonar !== (initialData.auscultacionPulmonar || "")
    )
  }, [fev1, fvc, fev1FvcRatio, spo2, mmrcDyspnea, auscultacionPulmonar, initialData])

  useEffect(() => {
    setDirty("neumonologia", isDirty)
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
      fev1: fev1 ? Number(fev1) : undefined,
      fvc: fvc ? Number(fvc) : undefined,
      fev1FvcRatio: fev1FvcRatio ? Number(fev1FvcRatio) : undefined,
      spo2: spo2 ? Number(spo2) : undefined,
      mmrcDyspnea,
      auscultacionPulmonar,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <Activity className="h-4 w-4 text-sky-400" />
        Evaluación y Función Pulmonar
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spirometry parameters */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Espirometría
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-slate-400 font-medium">
              FEV1
              <div className="relative mt-1">
                <input
                  type="number"
                  disabled={disabled}
                  placeholder="85"
                  value={fev1}
                  onChange={(e) => setFev1(e.target.value)}
                  className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1.5 text-sm text-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">% pred</span>
              </div>
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              FVC
              <div className="relative mt-1">
                <input
                  type="number"
                  disabled={disabled}
                  placeholder="90"
                  value={fvc}
                  onChange={(e) => setFvc(e.target.value)}
                  className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1.5 text-sm text-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">% pred</span>
              </div>
            </label>

            <label className="block text-xs text-slate-400 font-medium col-span-2">
              Relación FEV1/FVC
              <div className="relative mt-1">
                <input
                  type="number"
                  disabled={disabled}
                  placeholder="78"
                  value={fev1FvcRatio}
                  onChange={(e) => setFev1FvcRatio(e.target.value)}
                  className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1.5 text-sm text-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">%</span>
              </div>
            </label>
          </div>
        </div>

        {/* Dyspnea & SpO2 */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Oximetría y Clínica
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <label className="block text-xs text-slate-400 font-medium">
              Saturación de Oxígeno (SpO2)
              <div className="relative mt-1">
                <input
                  type="number"
                  disabled={disabled}
                  placeholder="98"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1.5 text-sm text-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">%</span>
              </div>
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Escala de Disnea mMRC
              <select
                disabled={disabled}
                value={mmrcDyspnea}
                onChange={(e) => setMmrcDyspnea(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
              >
                <option value="Grado 0">Grado 0 (Solo ante ejercicio intenso)</option>
                <option value="Grado 1">Grado 1 (Al andar rápido o subir una cuesta ligera)</option>
                <option value="Grado 2">Grado 2 (Obliga a andar más despacio que los de su edad)</option>
                <option value="Grado 3">Grado 3 (Obliga a parar a respirar después de caminar 100m)</option>
                <option value="Grado 4">Grado 4 (Impide salir de casa o al vestirse/desvestirse)</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-slate-400 font-medium">
          Auscultación Pulmonar
          <textarea
            disabled={disabled}
            placeholder="Murmullo vesicular conservado, presencia de ruidos agregados (crepitantes, sibilantes, roncus)..."
            value={auscultacionPulmonar}
            onChange={(e) => setAuscultacionPulmonar(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white resize-none"
          />
        </label>
      </div>

      {!disabled && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="rounded bg-sky-700 px-4 py-1.5 text-xs text-white hover:bg-sky-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Neumonología"}
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

"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Heart, Activity, CheckCircle } from "lucide-react"
import { VitalsChart } from "@/components/patients/vitals-chart"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  patientRegistrationId?: string
  disabled?: boolean
  initialData?: {
    ritmo?: string
    eje?: string
    prIntervalo?: number
    qrsDuracion?: number
    qtcIntervalo?: number
    hallazgosEcg?: string
    nyhaClase?: string
    riesgoCardio?: string
  }
}

export function CardiologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId }: Props) {
  const [ritmo, setRitmo] = useState(initialData.ritmo || "Sinusal")
  const [eje, setEje] = useState(initialData.eje || "Normal")
  const [prIntervalo, setPrIntervalo] = useState<string>(initialData.prIntervalo?.toString() || "")
  const [qrsDuracion, setQrsDuracion] = useState<string>(initialData.qrsDuracion?.toString() || "")
  const [qtcIntervalo, setQtcIntervalo] = useState<string>(initialData.qtcIntervalo?.toString() || "")
  const [hallazgosEcg, setHallazgosEcg] = useState(initialData.hallazgosEcg || "")
  const [nyhaClase, setNyhaClase] = useState(initialData.nyhaClase || "Clase I")
  const [riesgoCardio, setRiesgoCardio] = useState(initialData.riesgoCardio || "Bajo (<5%)")
  const [saved, setSaved] = useState(false)
  const { setDirty } = useUnsaved()

  const isDirty =
    ritmo !== (initialData.ritmo || "Sinusal") ||
    eje !== (initialData.eje || "Normal") ||
    prIntervalo !== (initialData.prIntervalo?.toString() || "") ||
    qrsDuracion !== (initialData.qrsDuracion?.toString() || "") ||
    qtcIntervalo !== (initialData.qtcIntervalo?.toString() || "") ||
    hallazgosEcg !== (initialData.hallazgosEcg || "") ||
    nyhaClase !== (initialData.nyhaClase || "Clase I") ||
    riesgoCardio !== (initialData.riesgoCardio || "Bajo (<5%)")

  useEffect(() => {
    setDirty("cardiologia", isDirty)
  }, [isDirty, setDirty])

  const utils = trpc.useUtils()
  const save = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setDirty("cardiologia", false)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  function handleSave() {
    const payload = {
      ritmo,
      eje,
      prIntervalo: prIntervalo ? Number(prIntervalo) : undefined,
      qrsDuracion: qrsDuracion ? Number(qrsDuracion) : undefined,
      qtcIntervalo: qtcIntervalo ? Number(qtcIntervalo) : undefined,
      hallazgosEcg,
      nyhaClase,
      riesgoCardio,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <Heart className="h-4 w-4 text-red-400" />
        Evaluación y Parámetros Cardiovasculares
      </h3>

      {patientRegistrationId && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Signos Vitales Históricos
          </h4>
          <VitalsChart patientRegistrationId={patientRegistrationId} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ECG parameters */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Electrocardiograma (ECG)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-slate-400 font-medium">
              Ritmo Cardíaco
              <select
                disabled={disabled}
                value={ritmo}
                onChange={(e) => setRitmo(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="Sinusal">Sinusal</option>
                <option value="Fibrilación Auricular">Fibrilación Auricular</option>
                <option value="Aleteo Auricular">Aleteo Auricular</option>
                <option value="Bloqueo AV (1er Grado)">Bloqueo AV (1er Grado)</option>
                <option value="Bloqueo AV (2do/3er Grado)">Bloqueo AV (2do/3er Grado)</option>
                <option value="Taquicardia Ventricular">Taquicardia Ventricular</option>
                <option value="Otro">Otro/Arrítmico</option>
              </select>
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Eje Eléctrico
              <select
                disabled={disabled}
                value={eje}
                onChange={(e) => setEje(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="Normal">Normal (0° a 90°)</option>
                <option value="Desviación Izquierda">Desviación Izquierda (&lt;0°)</option>
                <option value="Desviación Derecha">Desviación Derecha (&gt;90°)</option>
                <option value="Indeterminado">Indeterminado</option>
              </select>
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Intervalo PR
              <div className="relative mt-1">
                <input
                  type="number"
                  disabled={disabled}
                  placeholder="160"
                  value={prIntervalo}
                  onChange={(e) => setPrIntervalo(e.target.value)}
                  className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1.5 text-sm text-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">ms</span>
              </div>
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Complejo QRS
              <div className="relative mt-1">
                <input
                  type="number"
                  disabled={disabled}
                  placeholder="90"
                  value={qrsDuracion}
                  onChange={(e) => setQrsDuracion(e.target.value)}
                  className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1.5 text-sm text-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">ms</span>
              </div>
            </label>

            <label className="block text-xs text-slate-400 font-medium col-span-2">
              Intervalo QTc
              <div className="relative mt-1">
                <input
                  type="number"
                  disabled={disabled}
                  placeholder="420"
                  value={qtcIntervalo}
                  onChange={(e) => setQtcIntervalo(e.target.value)}
                  className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-10 py-1.5 text-sm text-white"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">ms</span>
              </div>
            </label>
          </div>
        </div>

        {/* Clinical Heart failure & risk */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Estado Funcional y Riesgo
          </h4>

          <label className="block text-xs text-slate-400 font-medium">
            Clasificación NYHA (Insuficiencia Cardíaca)
            <select
              disabled={disabled}
              value={nyhaClase}
              onChange={(e) => setNyhaClase(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
            >
              <option value="Clase I">Clase I (Sin limitación física)</option>
              <option value="Clase II">Clase II (Limitación leve con actividad ordinaria)</option>
              <option value="Clase III">Clase III (Limitación marcada con actividad menor a la ordinaria)</option>
              <option value="Clase IV">Clase IV (Incapacidad para cualquier actividad sin molestias/reposo)</option>
            </select>
          </label>

          <label className="block text-xs text-slate-400 font-medium">
            Riesgo Cardiovascular (Estimado SCORE / Framingham)
            <select
              disabled={disabled}
              value={riesgoCardio}
              onChange={(e) => setRiesgoCardio(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
            >
              <option value="Bajo (<5%)">Bajo (&lt;5%)</option>
              <option value="Moderado (5-10%)">Moderado (5-10%)</option>
              <option value="Alto (>10%)">Alto (&gt;10%)</option>
              <option value="Muy Alto (>20%)">Muy Alto (&gt;20%)</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-slate-400 font-medium">
          Interpretación / Hallazgos del ECG
          <textarea
            disabled={disabled}
            placeholder="Hipertrofia ventricular, trastornos de la conducción, isquemia, bloqueos..."
            value={hallazgosEcg}
            onChange={(e) => setHallazgosEcg(e.target.value)}
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
            className="rounded bg-red-700 px-4 py-1.5 text-xs text-white hover:bg-red-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Cardiología"}
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

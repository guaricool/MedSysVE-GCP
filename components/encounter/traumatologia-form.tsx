"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, Bone, Upload, FileImage } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"
import { InteractiveAnatomy } from "../patients/interactive-anatomy"
import { RadiologyViewer } from "../patients/radiology-viewer"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: any
}

export function TraumatologiaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [activeTab, setActiveTab] = useState<"PLAN" | "IMAGENES" | "MAPA">("PLAN")
  const [saved, setSaved] = useState(false)
  const utils = trpc.useUtils()

  const [data, setData] = useState({
    procedimiento: initialData.procedimiento || "",
    lateralidad: initialData.lateralidad || "",
    osteosintesis: initialData.osteosintesis || "",
    clasificacionAO: initialData.clasificacionAO || "",
    hallazgosAnatomicos: initialData.hallazgosAnatomicos || "",
    zonaAfectada: initialData.zonaAfectada || "",
    medicionesRx: initialData.medicionesRx || "",
  })

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return (
      data.procedimiento !== (initialData.procedimiento || "") ||
      data.lateralidad !== (initialData.lateralidad || "") ||
      data.osteosintesis !== (initialData.osteosintesis || "") ||
      data.clasificacionAO !== (initialData.clasificacionAO || "") ||
      data.hallazgosAnatomicos !== (initialData.hallazgosAnatomicos || "") ||
      data.zonaAfectada !== (initialData.zonaAfectada || "") ||
      data.medicionesRx !== (initialData.medicionesRx || "")
    )
  }, [data, initialData])

  useEffect(() => {
    setDirty("traumatologia", isDirty)
  }, [isDirty, setDirty])

  const saveForm = (trpc.encounter as any).updateSpecialtyData.useMutation({
    onSuccess: () => {
      utils.encounter.get.invalidate({ id: encounterId })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  function handleSave() {
    saveForm.mutate({
      encounterId,
      datosEspecialidad: data,
    })
  }

  function handleChange(field: string, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("PLAN")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "PLAN" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          Plan Quirúrgico
        </button>
        <button
          onClick={() => setActiveTab("MAPA")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "MAPA" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Bone className="h-3.5 w-3.5" />
          Mapeo Anatómico
        </button>
        <button
          onClick={() => setActiveTab("IMAGENES")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "IMAGENES" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <FileImage className="h-3.5 w-3.5" />
          Mediciones e Imágenes
        </button>
      </div>

      {/* Tab: PLAN QUIRURGICO */}
      {activeTab === "PLAN" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Procedimiento Propuesto</label>
            <input
              type="text"
              disabled={disabled}
              value={data.procedimiento}
              onChange={(e) => handleChange("procedimiento", e.target.value)}
              placeholder="Ej: Reducción Abierta y Fijación Interna (RAFI)"
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Lateralidad</label>
            <select
              disabled={disabled}
              value={data.lateralidad}
              onChange={(e) => handleChange("lateralidad", e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Seleccione...</option>
              <option value="Izquierda">Izquierda</option>
              <option value="Derecha">Derecha</option>
              <option value="Bilateral">Bilateral</option>
              <option value="No aplica">No aplica</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Material de Osteosíntesis (MOS)</label>
            <input
              type="text"
              disabled={disabled}
              value={data.osteosintesis}
              onChange={(e) => handleChange("osteosintesis", e.target.value)}
              placeholder="Ej: Placa LCP 4.5mm, tornillos corticales"
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Clasificación de Fractura (AO/OTA)</label>
            <input
              type="text"
              disabled={disabled}
              value={data.clasificacionAO}
              onChange={(e) => handleChange("clasificacionAO", e.target.value)}
              placeholder="Ej: 42-A1"
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Tab: MAPA ANATOMICO */}
      {activeTab === "MAPA" && (
        <div className="space-y-4">
          <InteractiveAnatomy 
            selectedZone={data.zonaAfectada} 
            selectedLateralidad={data.lateralidad}
            onSelectZone={(zone) => handleChange("zonaAfectada", zone)}
            onSelectLateralidad={(lat) => handleChange("lateralidad", lat)}
            disabled={disabled}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Zona Anatómica Afectada (Manual)</label>
              <select
                disabled={disabled}
                value={data.zonaAfectada}
                onChange={(e) => handleChange("zonaAfectada", e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Seleccione...</option>
                <option value="Hombro">Hombro</option>
                <option value="Brazo (Húmero)">Brazo (Húmero)</option>
                <option value="Codo">Codo</option>
                <option value="Antebrazo">Antebrazo</option>
                <option value="Muñeca">Muñeca</option>
                <option value="Mano/Dedos">Mano/Dedos</option>
                <option value="Columna Cervical">Columna Cervical</option>
                <option value="Columna Torácica">Columna Torácica</option>
                <option value="Columna Lumbar">Columna Lumbar</option>
                <option value="Pelvis/Cadera">Pelvis/Cadera</option>
                <option value="Muslo (Fémur)">Muslo (Fémur)</option>
                <option value="Rodilla">Rodilla</option>
                <option value="Pierna (Tibia/Peroné)">Pierna (Tibia/Peroné)</option>
                <option value="Tobillo">Tobillo</option>
                <option value="Pie">Pie</option>
              </select>
            </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Hallazgos Físicos Locales</label>
            <textarea
              disabled={disabled}
              value={data.hallazgosAnatomicos}
              onChange={(e) => handleChange("hallazgosAnatomicos", e.target.value)}
              rows={3}
              placeholder="Ej: Aumento de volumen, equimosis, deformidad evidente..."
              className="w-full resize-y rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          </div>
        </div>
      )}

      {/* Tab: IMAGENES Y MEDICIONES */}
      {activeTab === "IMAGENES" && (
        <div className="space-y-4">
          <RadiologyViewer />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Registro Manual de Mediciones Radiográficas</label>
            <textarea
              disabled={disabled}
              value={data.medicionesRx}
              onChange={(e) => handleChange("medicionesRx", e.target.value)}
              rows={3}
              placeholder="Ej: Dismetría MMII de 2cm. Ángulo de Cobb 15°. Espacio articular femorotibial disminuido..."
              className="w-full resize-y rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      {!disabled && (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saveForm.isPending}
            className="rounded bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {saveForm.isPending ? "Guardando..." : "Guardar Módulo de Traumatología"}
          </button>
          {saved && <span className="text-xs text-emerald-400">Datos guardados.</span>}
        </div>
      )}
    </div>
  )
}

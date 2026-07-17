"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, ShieldAlert, CheckCircle } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    t?: string
    n?: string
    m?: string
    estadio?: string
    cicloQuimio?: number
    esquemaQuimio?: string
    gradoDiferenciacion?: string
    notasOncologia?: string
  }
}

export function OncologiaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [t, setT] = useState(initialData.t || "T1")
  const [n, setN] = useState(initialData.n || "N0")
  const [m, setM] = useState(initialData.m || "M0")
  const [estadio, setEstadio] = useState(initialData.estadio || "Estadio I")
  const [cicloQuimio, setCicloQuimio] = useState<string>(initialData.cicloQuimio?.toString() || "")
  const [esquemaQuimio, setEsquemaQuimio] = useState(initialData.esquemaQuimio || "")
  const [gradoDiferenciacion, setGradoDiferenciacion] = useState(initialData.gradoDiferenciacion || "G1")
  const [notasOncologia, setNotasOncologia] = useState(initialData.notasOncologia || "")
  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return (
      t !== (initialData.t || "T1") ||
      n !== (initialData.n || "N0") ||
      m !== (initialData.m || "M0") ||
      estadio !== (initialData.estadio || "Estadio I") ||
      cicloQuimio !== (initialData.cicloQuimio?.toString() || "") ||
      esquemaQuimio !== (initialData.esquemaQuimio || "") ||
      gradoDiferenciacion !== (initialData.gradoDiferenciacion || "G1") ||
      notasOncologia !== (initialData.notasOncologia || "")
    )
  }, [t, n, m, estadio, cicloQuimio, esquemaQuimio, gradoDiferenciacion, notasOncologia, initialData])

  useEffect(() => {
    setDirty("oncologia", isDirty)
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
      t,
      n,
      m,
      estadio,
      cicloQuimio: cicloQuimio ? Number(cicloQuimio) : undefined,
      esquemaQuimio,
      gradoDiferenciacion,
      notasOncologia,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <ShieldAlert className="h-4 w-4 text-emerald-400" />
        Clasificación y Seguimiento Oncológico
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TNM Classification */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Estadiaje TNM
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs text-slate-400 font-medium">
              Tumor (T)
              <select
                disabled={disabled}
                value={t}
                onChange={(e) => setT(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="TX">TX</option>
                <option value="T0">T0</option>
                <option value="Tis">Tis</option>
                <option value="T1">T1</option>
                <option value="T2">T2</option>
                <option value="T3">T3</option>
                <option value="T4">T4</option>
              </select>
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Nódulos (N)
              <select
                disabled={disabled}
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="NX">NX</option>
                <option value="N0">N0</option>
                <option value="N1">N1</option>
                <option value="N2">N2</option>
                <option value="N3">N3</option>
              </select>
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Metástasis (M)
              <select
                disabled={disabled}
                value={m}
                onChange={(e) => setM(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="MX">MX</option>
                <option value="M0">M0</option>
                <option value="M1">M1</option>
              </select>
            </label>
          </div>

          <label className="block text-xs text-slate-400 font-medium">
            Estadio Clínico Sugerido / Definido
            <select
              disabled={disabled}
              value={estadio}
              onChange={(e) => setEstadio(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
            >
              <option value="Estadio 0">Estadio 0 (Carcinoma in situ)</option>
              <option value="Estadio I">Estadio I</option>
              <option value="Estadio II">Estadio II</option>
              <option value="Estadio III">Estadio III</option>
              <option value="Estadio IV">Estadio IV (Metastásico)</option>
              <option value="Desconocido">Desconocido</option>
            </select>
          </label>
        </div>

        {/* Chemotherapy details */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Esquema Terapéutico
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-slate-400 font-medium">
              Esquema Quimioterapia
              <input
                type="text"
                disabled={disabled}
                placeholder="Ej. FOLFOX, Paclitaxel"
                value={esquemaQuimio}
                onChange={(e) => setEsquemaQuimio(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
              />
            </label>

            <label className="block text-xs text-slate-400 font-medium">
              Ciclo Actual
              <input
                type="number"
                disabled={disabled}
                placeholder="1"
                value={cicloQuimio}
                onChange={(e) => setCicloQuimio(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
              />
            </label>
          </div>

          <label className="block text-xs text-slate-400 font-medium">
            Grado de Diferenciación (Histología)
            <select
              disabled={disabled}
              value={gradoDiferenciacion}
              onChange={(e) => setGradoDiferenciacion(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
            >
              <option value="G1">G1 - Bien diferenciado (Bajo grado)</option>
              <option value="G2">G2 - Moderadamente diferenciado (Grado medio)</option>
              <option value="G3">G3 - Pobremente diferenciado (Alto grado)</option>
              <option value="G4">G4 - Indiferenciado (Alto grado)</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-slate-400 font-medium">
          Notas Clínicas de Evolución Oncológica
          <textarea
            disabled={disabled}
            placeholder="Complicaciones, toxicidad, tolerancia, respuesta terapéutica..."
            value={notasOncologia}
            onChange={(e) => setNotasOncologia(e.target.value)}
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
            className="rounded bg-emerald-700 px-4 py-1.5 text-xs text-white hover:bg-emerald-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Oncología"}
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

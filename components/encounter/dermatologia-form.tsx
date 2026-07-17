"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, CheckCircle, Brush } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    tipoLesion?: string
    fototipoFitzpatrick?: string
    bordesLesion?: string
    distribucionLesion?: string
    descripcionLesion?: string
    pasiScore?: number
  }
}

export function DermatologiaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [tipoLesion, setTipoLesion] = useState(initialData.tipoLesion || "Mácula")
  const [fototipoFitzpatrick, setFototipoFitzpatrick] = useState(initialData.fototipoFitzpatrick || "Tipo III")
  const [bordesLesion, setBordesLesion] = useState(initialData.bordesLesion || "Definidos")
  const [distribucionLesion, setDistribucionLesion] = useState(initialData.distribucionLesion || "Localizada")
  const [descripcionLesion, setDescripcionLesion] = useState(initialData.descripcionLesion || "")
  const [pasiScore, setPasiScore] = useState<string>(initialData.pasiScore?.toString() || "")
  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return (
      tipoLesion !== (initialData.tipoLesion || "Mácula") ||
      fototipoFitzpatrick !== (initialData.fototipoFitzpatrick || "Tipo III") ||
      bordesLesion !== (initialData.bordesLesion || "Definidos") ||
      distribucionLesion !== (initialData.distribucionLesion || "Localizada") ||
      descripcionLesion !== (initialData.descripcionLesion || "") ||
      pasiScore !== (initialData.pasiScore?.toString() || "")
    )
  }, [tipoLesion, fototipoFitzpatrick, bordesLesion, distribucionLesion, descripcionLesion, pasiScore, initialData])

  useEffect(() => {
    setDirty("dermatologia", isDirty)
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
      tipoLesion,
      fototipoFitzpatrick,
      bordesLesion,
      distribucionLesion,
      descripcionLesion,
      pasiScore: pasiScore ? Number(pasiScore) : undefined,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <Brush className="h-4 w-4 text-amber-400" />
        Evaluación Dermatológica y Morfología de Lesión
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Morphology fields */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Características de la Lesión
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="block text-slate-400">
              Tipo de Lesión
              <select
                disabled={disabled}
                value={tipoLesion}
                onChange={(e) => setTipoLesion(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-white"
              >
                <option value="Mácula">Mácula (&lt;1cm, plana)</option>
                <option value="Pápula">Pápula (&lt;1cm, sobreelevada)</option>
                <option value="Nódulo">Nódulo (&gt;1cm, sólida, profunda)</option>
                <option value="Placa">Placa (&gt;1cm, sobreelevada plana)</option>
                <option value="Vesícula">Vesícula (&lt;1cm, contenido líquido)</option>
                <option value="Pústula">Pústula (contenido purulento)</option>
                <option value="Úlcera">Úlcera (pérdida de sustancia)</option>
              </select>
            </label>

            <label className="block text-slate-400">
              Fototipo Fitzpatrick
              <select
                disabled={disabled}
                value={fototipoFitzpatrick}
                onChange={(e) => setFototipoFitzpatrick(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-white"
              >
                <option value="Tipo I">Tipo I (Pálida, siempre se quema)</option>
                <option value="Tipo II">Tipo II (Blanca, suele quemarse)</option>
                <option value="Tipo III">Tipo III (Clara/Oscura, bronceado progresivo)</option>
                <option value="Tipo IV">Tipo IV (Mediterránea/Marrón, raramente se quema)</option>
                <option value="Tipo V">Tipo V (Marrón oscura, rarísima vez se quema)</option>
                <option value="Tipo VI">Tipo VI (Negra, nunca se quema)</option>
              </select>
            </label>

            <label className="block text-slate-400">
              Bordes
              <select
                disabled={disabled}
                value={bordesLesion}
                onChange={(e) => setBordesLesion(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-white"
              >
                <option value="Definidos">Definidos / Regulares</option>
                <option value="Irregulares">Irregulares / Difusos</option>
              </select>
            </label>

            <label className="block text-slate-400">
              Distribución
              <select
                disabled={disabled}
                value={distribucionLesion}
                onChange={(e) => setDistribucionLesion(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-white"
              >
                <option value="Localizada">Localizada</option>
                <option value="Generalizada">Generalizada</option>
                <option value="Simétrica">Simétrica</option>
                <option value="Dermatómica">Dermatómica / Zosteriforme</option>
              </select>
            </label>
          </div>
        </div>

        {/* Severity Metrics and PASI */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Gravedad y Extensión
          </h4>
          <label className="block text-xs text-slate-400 font-medium">
            PASI Score (Psoriasis Area & Severity Index)
            <div className="relative mt-1">
              <input
                type="number"
                step="0.1"
                disabled={disabled}
                placeholder="12.5"
                value={pasiScore}
                onChange={(e) => setPasiScore(e.target.value)}
                className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-10 py-1.5 text-white text-xs"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">pts</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Score calculado (0 a 72). Severidad severa es &gt;10.</span>
          </label>

          <label className="block text-xs text-slate-400 font-medium">
            Descripción Detallada de Lesiones
            <textarea
              disabled={disabled}
              placeholder="Describir color, diámetro en mm, presencia de escamas, costras, eritema o induración..."
              value={descripcionLesion}
              onChange={(e) => setDescripcionLesion(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white resize-none"
            />
          </label>
        </div>
      </div>

      {!disabled && (
        <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="rounded bg-amber-700 px-4 py-1.5 text-xs text-white hover:bg-amber-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Dermatología"}
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

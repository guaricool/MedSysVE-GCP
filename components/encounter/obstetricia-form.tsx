"use client"

import { useState, useEffect, useMemo } from "react"
import { trpc } from "@/lib/trpc-client"
import { Baby, Calendar, Heart, Ruler, CheckCircle } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    fum?: string
    fpp?: string
    semanasGestacion?: number
    fcf?: number
    alturaUterina?: number
    presentacion?: string
    movimientos?: string
    notasObstetricia?: string
  }
}

export function ObstetriciaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [fum, setFum] = useState(initialData.fum || "")
  const [fpp, setFpp] = useState(initialData.fpp || "")
  const [semanas, setSemanas] = useState<string>("")
  const [fcf, setFcf] = useState<string>(initialData.fcf?.toString() || "")
  const [alturaUterina, setAlturaUterina] = useState<string>(initialData.alturaUterina?.toString() || "")
  const [presentacion, setPresentacion] = useState(initialData.presentacion || "Cefálica")
  const [movimientos, setMovimientos] = useState(initialData.movimientos || "Presentes")
  const [notasObstetricia, setNotasObstetricia] = useState(initialData.notasObstetricia || "")
  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return (
      fum !== (initialData.fum || "") ||
      fpp !== (initialData.fpp || "") ||
      fcf !== (initialData.fcf?.toString() || "") ||
      alturaUterina !== (initialData.alturaUterina?.toString() || "") ||
      presentacion !== (initialData.presentacion || "Cefálica") ||
      movimientos !== (initialData.movimientos || "Presentes") ||
      notasObstetricia !== (initialData.notasObstetricia || "")
    )
  }, [fum, fpp, fcf, alturaUterina, presentacion, movimientos, notasObstetricia, initialData])

  useEffect(() => {
    setDirty("obstetricia", isDirty)
  }, [isDirty, setDirty])

  const utils = trpc.useUtils()
  const save = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  // Calculate FPP and Gestational Weeks in real-time
  useEffect(() => {
    if (!fum) {
      setFpp("")
      setSemanas("")
      return
    }

    const dateFum = new Date(fum + "T00:00:00")
    if (isNaN(dateFum.getTime())) return

    // FPP calculation: FUM + 280 days (40 weeks)
    const dateFpp = new Date(dateFum.getTime())
    dateFpp.setDate(dateFpp.getDate() + 280)
    setFpp(dateFpp.toISOString().split("T")[0])

    // Gestational Weeks calculation: (Today - FUM) in milliseconds / (1000 * 60 * 60 * 24 * 7)
    const today = new Date()
    const diffTime = today.getTime() - dateFum.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      setSemanas("Fecha de última regla a futuro")
      return
    }

    const w = Math.floor(diffDays / 7)
    const d = diffDays % 7
    setSemanas(`${w} semanas y ${d} días`)
  }, [fum])

  function handleSave() {
    const payload = {
      fum: fum || undefined,
      fpp: fpp || undefined,
      semanasGestacion: semanas ? parseFloat(semanas.split(" ")[0]) : undefined,
      fcf: fcf ? Number(fcf) : undefined,
      alturaUterina: alturaUterina ? Number(alturaUterina) : undefined,
      presentacion,
      movimientos,
      notasObstetricia,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <Baby className="h-4 w-4 text-pink-400" />
        Evaluación y Control Obstétrico
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FUM & FPP */}
        <div className="space-y-3">
          <label className="block text-xs text-slate-400 font-medium">
            Fecha de Última Menstruación (FUM)
            <input
              type="date"
              disabled={disabled}
              value={fum}
              onChange={(e) => setFum(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
            />
          </label>

          {fum && (
            <div className="rounded bg-pink-950/20 border border-pink-900/40 p-3 space-y-1 text-xs">
              <p className="flex items-center gap-1.5 text-pink-300 font-medium">
                <Calendar className="h-3.5 w-3.5" />
                Fecha Probable de Parto (FPP): <span className="text-white font-bold">{fpp}</span>
              </p>
              <p className="text-slate-300">
                Edad Gestacional Actual: <span className="text-white font-semibold">{semanas}</span>
              </p>
            </div>
          )}
        </div>

        {/* Fetal parameters */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs text-slate-400 font-medium">
            Frecuencia Cardíaca Fetal (FCF)
            <div className="relative mt-1">
              <input
                type="number"
                disabled={disabled}
                placeholder="140"
                value={fcf}
                onChange={(e) => setFcf(e.target.value)}
                className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1.5 text-sm text-white"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">lpm</span>
            </div>
          </label>

          <label className="block text-xs text-slate-400 font-medium">
            Altura Uterina (AU)
            <div className="relative mt-1">
              <input
                type="number"
                disabled={disabled}
                placeholder="22"
                value={alturaUterina}
                onChange={(e) => setAlturaUterina(e.target.value)}
                className="block w-full rounded border border-slate-700 bg-slate-800 pl-3 pr-8 py-1.5 text-sm text-white"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-semibold">cm</span>
            </div>
          </label>

          <label className="block text-xs text-slate-400 font-medium">
            Presentación Fetal
            <select
              disabled={disabled}
              value={presentacion}
              onChange={(e) => setPresentacion(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
            >
              <option value="Cefálica">Cefálica</option>
              <option value="Podálica">Podálica</option>
              <option value="Transversa">Transversa</option>
              <option value="Oblicua">Oblicua</option>
            </select>
          </label>

          <label className="block text-xs text-slate-400 font-medium">
            Movimientos Fetales
            <select
              disabled={disabled}
              value={movimientos}
              onChange={(e) => setMovimientos(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-white"
            >
              <option value="Presentes">Presentes</option>
              <option value="Disminuidos">Disminuidos</option>
              <option value="Ausentes">Ausentes</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-slate-400 font-medium">
          Notas de Evolución Obstétrica
          <textarea
            disabled={disabled}
            placeholder="Detalles sobre ecografía, placenta, líquido amniótico..."
            value={notasObstetricia}
            onChange={(e) => setNotasObstetricia(e.target.value)}
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
            className="rounded bg-pink-700 px-4 py-1.5 text-xs text-white hover:bg-pink-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Obstetricia"}
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

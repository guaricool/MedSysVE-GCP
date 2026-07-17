"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Scan, FileText, Plus, Trash2 } from "lucide-react"

const TIPOS_IMAGEN = ["Radiografía", "Ecografía", "TAC", "RMN", "Mamografía", "Densitometría", "Otro"]

interface Props {
  encounterId: string
  disabled?: boolean
}

interface StudyDraft {
  id: string // local-only key
  tipoImagen: string
  region: string
  notas: string
}

function emptyStudy(): StudyDraft {
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tipoImagen: "",
    region: "",
    notas: "",
  }
}

export function ImagingOrderForm({ encounterId, disabled }: Props) {
  const [studies, setStudies] = useState<StudyDraft[]>([emptyStudy()])
  const [indicaciones, setIndicaciones] = useState("")
  const [urgente, setUrgente] = useState(false)
  const utils = trpc.useUtils()

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    // If the default study is modified or there are more studies, or other fields have text/boolean changes
    const hasModifiedStudies = studies.length > 1 || (studies.length === 1 && (studies[0].tipoImagen !== "" || studies[0].region !== "" || studies[0].notas !== ""))
    return hasModifiedStudies || indicaciones.trim() !== "" || urgente !== false
  }, [studies, indicaciones, urgente])

  useEffect(() => {
    setDirty("imagingOrder", isDirty)
  }, [isDirty, setDirty])

  const { data: enc } = trpc.encounter.get.useQuery({ id: encounterId })
  const existingOrders = (enc?.imagingOrders ?? []) as {
    id: string
    tipoImagen: string
    region: string
    indicacionesClinicas?: string | null
    urgente: boolean
    pdfUrl?: string | null
    items?: { id: string; tipoImagen: string; region: string; notas?: string | null }[]
  }[]

  const add = trpc.encounter.addImagingOrder.useMutation({
    onSuccess: () => {
      utils.encounter.get.invalidate({ id: encounterId })
      setStudies([emptyStudy()])
      setIndicaciones("")
      setUrgente(false)
    },
  })

  const updateStudy = (id: string, patch: Partial<StudyDraft>) => {
    setStudies((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }
  const addStudy = () => setStudies((prev) => [...prev, emptyStudy()])
  const removeStudy = (id: string) => {
    setStudies((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)))
  }

  // Pre-render helper for the existing-orders list. The legacy schema
  // stored a single estudio per order; new orders carry an `items[]`
  // array. We support both transparently.
  const renderExistingStudies = (io: (typeof existingOrders)[number]): string[] => {
    if (io.items && io.items.length > 0) {
      return io.items.map((it) => `${it.tipoImagen} — ${it.region}`)
    }
    return [`${io.tipoImagen} — ${io.region}`]
  }

  const ExistingOrders = () =>
    existingOrders.length > 0 ? (
      <div className="space-y-2 mb-4">
        {existingOrders.map((io, idx) => (
          <div key={io.id} className="rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-xs uppercase tracking-wide">
                  Orden #{idx + 1}
                  {io.urgente && (
                    <span className="ml-2 text-red-400 text-[10px] bg-red-900/40 px-1.5 py-0.5 rounded">
                      URGENTE
                    </span>
                  )}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {renderExistingStudies(io).map((s, i) => (
                    <li key={i} className="text-slate-300 text-xs">
                      {i + 1}. {s}
                    </li>
                  ))}
                </ul>
                {io.indicacionesClinicas && (
                  <p className="text-slate-500 text-xs mt-1 italic">{io.indicacionesClinicas}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`/api/pdf/imaging-order/${io.id}`, "_blank")}
                className="h-6 px-2 text-xs border-slate-700 text-slate-400 hover:bg-slate-800"
              >
                <FileText size={11} className="mr-1" />
                PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    ) : null

  if (disabled) {
    return (
      <div>
        <ExistingOrders />
        {existingOrders.length === 0 && (
          <p className="text-sm text-slate-500 italic">Sin órdenes de imagenología.</p>
        )}
      </div>
    )
  }

  const readyToSave = studies.every((s) => s.tipoImagen.trim() && s.region.trim())

  return (
    <div className="space-y-4">
      <ExistingOrders />

      <div className="space-y-3">
        <Label className="text-slate-300 text-xs">Estudios a solicitar</Label>
        {studies.map((s, idx) => (
          <div
            key={s.id}
            className="rounded-md border border-slate-700 bg-slate-900/40 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Estudio {idx + 1}
              </span>
              {studies.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => removeStudy(s.id)}
                  className="h-6 px-2 text-slate-500 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={s.tipoImagen}
                onChange={(e) => updateStudy(s.id, { tipoImagen: e.target.value })}
                className="w-full rounded-md bg-slate-800 border border-slate-700 text-white px-3 py-2 text-sm"
              >
                <option value="">Tipo...</option>
                {TIPOS_IMAGEN.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Región (ej: Hombro derecho AP y axial)"
                value={s.region}
                onChange={(e) => updateStudy(s.id, { region: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Input
              placeholder="Notas opcionales (proyecciones, contraste, etc.)"
              value={s.notas}
              onChange={(e) => updateStudy(s.id, { notas: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStudy}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <Plus size={14} className="mr-2" />
          Agregar otro estudio
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="text-slate-300 text-xs">Diagnóstico / indicación clínica (común a todos)</Label>
        <Textarea
          placeholder="Ej: dx: rotura de manguito rotador + rotura de labrum anterior..."
          value={indicaciones}
          onChange={(e) => setIndicaciones(e.target.value)}
          rows={3}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={urgente}
          onChange={(e) => setUrgente(e.target.checked)}
          className="rounded border-slate-600 bg-slate-800"
        />
        Marcar como urgente
      </label>

      <Button
        disabled={!readyToSave || add.isPending}
        onClick={() =>
          add.mutate({
            encounterId,
            items: studies.map((s) => ({
              tipoImagen: s.tipoImagen,
              region: s.region,
              notas: s.notas.trim() || undefined,
            })),
            indicacionesClinicas: indicaciones || undefined,
            urgente,
          })
        }
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Scan size={14} className="mr-2" />
        {add.isPending
          ? "Guardando..."
          : studies.length > 1
            ? `Crear orden con ${studies.length} estudios`
            : "Crear orden de imagen"}
      </Button>

      {add.isSuccess && (
        <p className="text-sm text-green-400">Orden de imagenología registrada.</p>
      )}
    </div>
  )
}
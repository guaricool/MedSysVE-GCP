"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plus, X, FlaskConical, FileText } from "lucide-react"

interface Props {
  encounterId: string
  disabled?: boolean
}

export function LabOrderForm({ encounterId, disabled }: Props) {
  const [estudios, setEstudios] = useState<string[]>([])
  const [draftEstudio, setDraftEstudio] = useState("")
  const [indicaciones, setIndicaciones] = useState("")
  const [urgente, setUrgente] = useState(false)
  const utils = trpc.useUtils()

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return estudios.length > 0 || draftEstudio.trim() !== "" || indicaciones.trim() !== "" || urgente !== false
  }, [estudios, draftEstudio, indicaciones, urgente])

  useEffect(() => {
    setDirty("labOrder", isDirty)
  }, [isDirty, setDirty])

  const { data: enc } = trpc.encounter.get.useQuery({ id: encounterId })
  const existingOrders = (enc?.labOrders ?? []) as {
    id: string
    estudios: string[]
    indicacionesClinicas?: string | null
    urgente: boolean
    pdfUrl?: string | null
  }[]

  const add = trpc.encounter.addLabOrder.useMutation({
    onSuccess: () => {
      utils.encounter.get.invalidate({ id: encounterId })
      setEstudios([])
      setDraftEstudio("")
      setIndicaciones("")
      setUrgente(false)
    },
  })


  function agregarEstudio() {
    const t = draftEstudio.trim()
    if (t) {
      setEstudios((prev) => [...prev, t])
      setDraftEstudio("")
    }
  }

  const ExistingOrders = () =>
    existingOrders.length > 0 ? (
      <div className="space-y-2 mb-4">
        {existingOrders.map((lo, idx) => (
          <div key={lo.id} className="rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium text-white text-xs uppercase tracking-wide">
                Orden #{idx + 1}
                {lo.urgente && (
                  <span className="ml-2 text-red-400 text-[10px] bg-red-900/40 px-1.5 py-0.5 rounded">URGENTE</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/api/pdf/lab-order/${lo.id}`, "_blank")}
                  className="h-6 px-2 text-xs border-slate-700 text-slate-400 hover:bg-slate-800"
                >
                  <FileText size={11} className="mr-1" />
                  PDF
                </Button>
              </div>
            </div>
            <ul className="mt-1 space-y-0.5">
              {lo.estudios.map((e, i) => (
                <li key={i} className="text-slate-300 text-xs">• {e}</li>
              ))}
            </ul>
            {lo.indicacionesClinicas && (
              <p className="text-slate-500 text-xs mt-1 italic">{lo.indicacionesClinicas}</p>
            )}
          </div>
        ))}
      </div>
    ) : null

  if (disabled) {
    return (
      <div>
        <ExistingOrders />
        {existingOrders.length === 0 && <p className="text-sm text-slate-500 italic">Sin órdenes de laboratorio.</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ExistingOrders />
      <div className="flex gap-2">
        <Input
          placeholder="Agregar estudio (ej. Hematología completa)"
          value={draftEstudio}
          onChange={(e) => setDraftEstudio(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregarEstudio())}
          className="bg-slate-800 border-slate-700 text-white"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={agregarEstudio}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 shrink-0"
        >
          <Plus size={14} />
        </Button>
      </div>

      {estudios.length > 0 && (
        <ul className="space-y-1">
          {estudios.map((e, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-200"
            >
              <span>• {e}</span>
              <button
                onClick={() => setEstudios((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-slate-500 hover:text-red-400"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1">
        <Label className="text-slate-300 text-xs">Indicaciones clínicas</Label>
        <Textarea
          placeholder="Sospecha diagnóstica e indicaciones para el laboratorio..."
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
        disabled={estudios.length === 0 || add.isPending}
        onClick={() => add.mutate({ encounterId, estudios, indicacionesClinicas: indicaciones || undefined, urgente })}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <FlaskConical size={14} className="mr-2" />
        {add.isPending ? "Guardando..." : "Crear orden de laboratorio"}
      </Button>

      {add.isSuccess && (
        <p className="text-sm text-green-400">Orden de laboratorio registrada.</p>
      )}
    </div>
  )
}

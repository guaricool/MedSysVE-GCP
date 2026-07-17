"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"
import { calcularFechaFin } from "@/lib/clinical/reposo"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileText } from "lucide-react"

interface Props {
  encounterId: string
  patientRegId: string
  disabled?: boolean
}

function fmtVE(isoDate: string): string {
  const [y, m, d] = isoDate.split("-")
  return `${d}/${m}/${y}`
}

export function ReposoForm({ encounterId, patientRegId, disabled }: Props) {
  const [dias, setDias] = useState(1)
  const [inicio, setInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [diagnosticoRef, setDiagnosticoRef] = useState("")
  const [observaciones, setObservaciones] = useState("")

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return (
      dias !== 1 ||
      inicio !== new Date().toISOString().slice(0, 10) ||
      diagnosticoRef.trim() !== "" ||
      observaciones.trim() !== ""
    )
  }, [dias, inicio, diagnosticoRef, observaciones])

  useEffect(() => {
    setDirty("reposo", isDirty)
  }, [isDirty, setDirty])

  const save = trpc.document.save.useMutation()
  const sign = trpc.document.sign.useMutation()

  const fin = calcularFechaFin(new Date(inicio + "T00:00:00"), dias).toISOString().slice(0, 10)
  const isPending = save.isPending || sign.isPending

  async function generar() {
    const html = [
      `<p>Se indica reposo médico por <strong>${dias} día(s)</strong>.</p>`,
      `<p>Desde el: <strong>${fmtVE(inicio)}</strong> hasta el: <strong>${fmtVE(fin)}</strong>.</p>`,
      diagnosticoRef ? `<p>Diagnóstico: ${diagnosticoRef}</p>` : "",
      observaciones ? `<p>${observaciones}</p>` : "",
    ]
      .filter(Boolean)
      .join("")

    const doc = await save.mutateAsync({
      encounterId,
      patientRegistrationId: patientRegId,
      tipo: "REPOSO",
      contenidoHtml: html,
    })
    await sign.mutateAsync({ id: doc.id })
    window.open(`/api/pdf/document/${doc.id}`, "_blank")
  }

  if (disabled) {
    return <p className="text-sm text-slate-500 italic">Consulta firmada.</p>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-slate-300 text-xs">Días de reposo</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-slate-300 text-xs">Fecha de inicio</Label>
          <Input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Hasta:{" "}
        <span className="font-medium text-slate-300">{fmtVE(fin)}</span>
      </p>

      <div className="space-y-1">
        <Label className="text-slate-300 text-xs">Diagnóstico de referencia</Label>
        <Input
          placeholder="Ej: Faringitis aguda (J02)"
          value={diagnosticoRef}
          onChange={(e) => setDiagnosticoRef(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-slate-300 text-xs">Observaciones</Label>
        <Textarea
          placeholder="Observaciones adicionales..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={3}
        />
      </div>

      <Button
        onClick={generar}
        disabled={isPending}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <FileText size={14} className="mr-2" />
        {isPending ? "Generando..." : "Generar Reposo PDF"}
      </Button>

    </div>
  )
}

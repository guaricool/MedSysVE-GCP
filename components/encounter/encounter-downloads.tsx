"use client"

import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

const TIPO_LABELS: Record<string, string> = {
  REPOSO: "Reposo Médico",
  REFERIDO: "Referido Médico",
  INFORME: "Informe Médico",
  CERTIFICADO: "Certificado Médico",
  RECETA: "Receta Médica",
}

export function EncounterDownloads({ encounterId }: { encounterId: string }) {
  const { data: enc } = trpc.encounter.get.useQuery({ id: encounterId })

  if (!enc) return null

  const items: { label: string; url: string }[] = []

  for (let i = 0; i < enc.prescriptions.length; i++) {
    const p = enc.prescriptions[i]
    items.push({
      label: enc.prescriptions.length > 1 ? `Receta #${i + 1}` : "Receta Médica",
      url: `/api/pdf/prescription/${p.id}`,
    })
  }

  for (let i = 0; i < enc.labOrders.length; i++) {
    const lo = enc.labOrders[i]
    items.push({
      label: enc.labOrders.length > 1 ? `Laboratorio #${i + 1}` : "Laboratorio Clínico",
      url: `/api/pdf/lab-order/${lo.id}`,
    })
  }

  for (let i = 0; i < enc.imagingOrders.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const io = enc.imagingOrders[i] as any
    items.push({
      label: enc.imagingOrders.length > 1 ? `Imagen #${i + 1} — ${io.tipoImagen}` : `Imagen — ${io.tipoImagen}`,
      url: `/api/pdf/imaging-order/${io.id}`,
    })
  }

  for (const d of enc.documents) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = d as any
    items.push({
      label: TIPO_LABELS[doc.tipo as string] ?? doc.tipo,
      url: `/api/pdf/document/${doc.id}`,
    })
  }

  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <Button
          key={item.url}
          variant="outline"
          size="sm"
          onClick={() => window.open(item.url, "_blank")}
          className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <FileDown size={13} className="mr-1.5" />
          {item.label}
        </Button>
      ))}
    </div>
  )
}

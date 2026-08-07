"use client"

import { trpc } from "@/lib/trpc-client"
import { FileText, FlaskConical, Scan, ExternalLink, Trash2, Clock, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { sharePdfFile } from "@/lib/utils"
import { toast } from "sonner"

const tipoIcon = {
  RECETA: <FileText size={14} className="text-blue-400" />,
  LABORATORIO: <FlaskConical size={14} className="text-green-400" />,
  IMAGEN: <Scan size={14} className="text-purple-400" />,
}

const tipoLabel = {
  RECETA: "Receta Médica",
  LABORATORIO: "Orden de Laboratorio",
  IMAGEN: "Orden de Imagenología",
}

export function ExpressOrderList() {
  const { data, isLoading, refetch } = trpc.expressOrder.list.useQuery()
  const del = trpc.expressOrder.delete.useMutation({ onSuccess: () => refetch() })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 py-16 text-center">
        <FileText size={32} className="mb-3 text-slate-600" />
        <p className="text-slate-400 text-sm">No has generado órdenes express aún</p>
        <p className="text-slate-500 text-xs mt-1">
          Crea recetas, órdenes de laboratorio o imagenología sin registrar pacientes
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {(data as Array<{ id: string; tipo: string; pacienteNombre: string; pacienteApellido: string; pacienteCedula: string | null; createdAt: Date | string }>).map((order) => {
        const label = `${tipoLabel[order.tipo as keyof typeof tipoLabel]} - ${order.pacienteNombre} ${order.pacienteApellido}`
        const pdfUrl = `/api/pdf/express/${order.id}`

        return (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              {tipoIcon[order.tipo as keyof typeof tipoIcon]}
              <div>
                <p className="text-sm text-white font-medium">
                  {order.pacienteNombre} {order.pacienteApellido}
                </p>
                <p className="text-xs text-slate-400">
                  {tipoLabel[order.tipo as keyof typeof tipoLabel]}
                  {order.pacienteCedula && <> · {order.pacienteCedula}</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:flex items-center gap-1 text-xs text-slate-500 mr-2">
                <Clock size={10} />
                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 gap-1.5 border-slate-700 bg-slate-800 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-colors"
                onClick={async () => {
                  const promise = sharePdfFile(pdfUrl, `${label}.pdf`, label)
                  toast.promise(promise, {
                    loading: "Preparando PDF para compartir...",
                    success: "Menú de compartir abierto",
                    error: "No se pudo compartir el PDF",
                  })
                }}
              >
                <Share2 size={13} />
                <span className="text-xs font-medium">Compartir</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Ver PDF"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={() => window.open(pdfUrl, "_blank")}
              >
                <ExternalLink size={13} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Eliminar"
                className="h-8 w-8 p-0 text-slate-500 hover:text-red-400 hover:bg-red-950/30"
                onClick={() => del.mutate({ id: order.id })}
                disabled={del.isPending}
              >
                <Trash2 size={13} />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

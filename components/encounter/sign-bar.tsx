"use client"

import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { CheckCircle, Lock, FileDown, Edit3 } from "lucide-react"
import { EncounterDownloads } from "./encounter-downloads"
import { DeleteEncounterModal } from "./delete-encounter-modal"
import { toast } from "sonner"

interface Props {
  encounterId: string
  patientRegId: string
  status: "DRAFT" | "SIGNED" | "AMENDED"
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  SIGNED: "Firmada",
  AMENDED: "Enmendada",
}

export function SignBar({ encounterId, patientRegId, status }: Props) {
  const router = useRouter()
  const sign = trpc.encounter.sign.useMutation({
    onSuccess: () => router.refresh(),
  })
  const reopen = trpc.encounter.reopen.useMutation({
    onSuccess: () => {
      toast.success("Consulta reabierta")
      router.refresh()
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-800 bg-slate-950/95 px-6 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "DRAFT" ? (
            <span className="rounded bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-400">
              {STATUS_LABELS[status]}
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded bg-emerald-900/40 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <Lock size={11} />
              {STATUS_LABELS[status]}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DeleteEncounterModal encounterId={encounterId} patientRegId={patientRegId} />

          {status !== "DRAFT" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reopen.mutate({ id: encounterId })}
                disabled={reopen.isPending}
                className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Edit3 size={14} className="mr-1.5" />
                {reopen.isPending ? "Reabriendo..." : "Editar consulta"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/api/pdf/encounter/${encounterId}`, "_blank")}
                className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <FileDown size={14} className="mr-1.5" />
                Informe
              </Button>
              <EncounterDownloads encounterId={encounterId} />
            </>
          )}

          {status === "DRAFT" && (
            <Button
              onClick={() => sign.mutate({ id: encounterId })}
              disabled={sign.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle size={16} className="mr-2" />
              {sign.isPending ? "Firmando..." : "Firmar y cerrar consulta"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

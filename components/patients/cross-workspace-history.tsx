"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { CrossWorkspaceViewer } from "./cross-workspace-viewer"
import { Building2 } from "lucide-react"

interface CrossWorkspaceHistoryProps {
  patientRegistrationId: string
}

export function CrossWorkspaceHistory({ patientRegistrationId }: CrossWorkspaceHistoryProps) {
  const { data: encounters, isLoading } = trpc.encounter.listCrossWorkspace.useQuery({ patientRegistrationId })
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null)

  if (isLoading || !encounters || encounters.length === 0) {
    return null
  }

  return (
    <div className="mt-8 border-t border-slate-800/60 pt-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-semibold text-slate-300 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-400" />
          Consultas previas (Otros consultorios)
        </h2>
      </div>

      <ul className="space-y-2">
        {encounters.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => setSelectedEncounterId(e.id)}
              className="w-full text-left block rounded-lg border border-slate-800 bg-slate-900/30 p-4 hover:border-slate-700 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-300">{e.motivo ?? "Consulta"}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded px-2 py-0.5 text-xs font-medium bg-blue-950 text-blue-400 border border-blue-900/50">
                    {e.workspace.nombre}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(e.createdAt).toLocaleDateString("es-VE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "America/Caracas",
                    })}
                  </span>
                </div>
              </div>
              {e.diagnoses.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  {e.diagnoses.map((d) => `${d.codigoCie10} — ${d.descripcion}`).join(" | ")}
                </p>
              )}
            </button>
          </li>
        ))}
      </ul>

      <CrossWorkspaceViewer 
        encounterId={selectedEncounterId}
        open={selectedEncounterId !== null}
        onClose={() => setSelectedEncounterId(null)}
      />
    </div>
  )
}

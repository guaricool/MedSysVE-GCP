"use client"

import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { X, Calendar, Activity, Pill, Stethoscope, Building2 } from "lucide-react"

interface CrossWorkspaceViewerProps {
  encounterId: string | null
  open: boolean
  onClose: () => void
}

export function CrossWorkspaceViewer({ encounterId, open, onClose }: CrossWorkspaceViewerProps) {
  const { data: encounter, isLoading } = trpc.encounter.getCrossWorkspace.useQuery(
    { id: encounterId! },
    { enabled: !!encounterId && open }
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 md:p-8 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-950 w-full max-w-3xl rounded-xl shadow-2xl border border-slate-800 overflow-hidden text-white my-auto flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-400" />
              Historial de otro consultorio
            </h2>
            {encounter && (
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                <span className="text-blue-400 font-medium">{encounter.workspace.nombre}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(encounter.createdAt).toLocaleDateString("es-VE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-slate-400">
              Cargando historial clínico...
            </div>
          )}
          
          {encounter && (
            <>
              {encounter.motivo && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" /> Motivo de Consulta
                  </h3>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-slate-300">
                    {encounter.motivo}
                  </div>
                </div>
              )}

              {encounter.historiaClinica && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                    Enfermedad Actual
                  </h3>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-slate-300 whitespace-pre-wrap text-sm">
                    {encounter.historiaClinica}
                  </div>
                </div>
              )}

              {encounter.diagnoses && encounter.diagnoses.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-purple-400" /> Diagnósticos
                  </h3>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                    <ul className="space-y-2">
                      {encounter.diagnoses.map(d => (
                        <li key={d.id} className="text-sm text-slate-300">
                          <span className="text-slate-500 font-mono mr-2">{d.codigoCie10}</span>
                          {d.descripcion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {encounter.plan && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                    Plan
                  </h3>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-slate-300 whitespace-pre-wrap text-sm">
                    {encounter.plan}
                  </div>
                </div>
              )}

              {encounter.prescriptions && encounter.prescriptions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Pill className="h-4 w-4 text-blue-400" /> Récipe
                  </h3>
                  {encounter.prescriptions.map(p => (
                    <div key={p.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mb-2">
                      <ul className="space-y-3">
                        {p.items.map(item => (
                          <li key={item.id} className="text-sm">
                            <div className="font-medium text-white">
                              {item.medication?.nombreGenerico ?? "Medicamento desconocido"} 
                              <span className="text-slate-400 font-normal ml-2">{item.concentracion}</span>
                            </div>
                            <div className="text-slate-400 mt-0.5">
                              Tomar {item.dosis} cada {item.frecuencia} por {item.duracion}
                            </div>
                            {item.indicacionesEspeciales && (
                              <div className="text-slate-500 italic mt-1 bg-slate-950 p-2 rounded border border-slate-800/50 text-xs">
                                {item.indicacionesEspeciales}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

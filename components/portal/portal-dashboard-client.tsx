"use client"

import { useState } from "react"
import { PortalMensajesClient } from "./portal-mensajes-client"
import { PortalAppointmentsClient } from "./portal-appointments-client"
import { UserCircle, Syringe, Microscope, FileText, Calendar, MessageSquare, Pill } from "lucide-react"
import Link from "next/link"

const TIPO_LABEL: Record<string, string> = {
  INFORME: "Informe médico",
  REPOSO: "Reposo",
  REFERIDO: "Referido",
  CERTIFICADO: "Certificado",
  RECETA: "Receta",
}

export function PortalDashboardClient({
  workspaces,
  docs,
  encounters,
  appointments,
  vaccines,
  imagingOrders,
  labOrders,
  labResults,
  prescriptions,
}: any) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"resumen" | "documentos" | "mensajes">("resumen")

  if (workspaces.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        No tiene médicos asignados.
      </div>
    )
  }

  if (!activeWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <UserCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a tu Portal</h2>
          <p className="text-slate-400 max-w-md">Por favor, selecciona al médico tratante del cual deseas consultar tu historial médico, recetas y resultados.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl">
          {workspaces.map((w: any) => (
            <button
              type="button"
              key={w.workspaceId}
              onClick={() => setActiveWorkspaceId(w.workspaceId)}
              className="flex flex-col items-center p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 transition-all text-center group"
            >
              <div className="p-3 rounded-full bg-slate-800 group-hover:bg-blue-600 group-hover:text-white text-slate-400 transition-colors mb-4">
                <UserCircle size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Dr. {w.doctor.nombre} {w.doctor.apellido}</h3>
              <p className="text-sm text-slate-400">{w.doctor.especialidadPrincipal}</p>
              <p className="text-xs text-slate-500 mt-2">{w.workspaceNombre}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const activeWorkspace = workspaces.find((w: any) => w.workspaceId === activeWorkspaceId)

  const wDocs = docs.filter((d: any) => d.patientRegistration?.workspaceId === activeWorkspaceId)
  const wEncounters = encounters.filter((e: any) => e.workspaceId === activeWorkspaceId)
  const wAppointments = appointments.filter((a: any) => a.workspaceId === activeWorkspaceId)
  const wVaccines = vaccines.filter((v: any) => v.workspaceId === activeWorkspaceId)
  const wImagingOrders = imagingOrders.filter((o: any) => o.encounter?.patientRegistration?.workspaceId === activeWorkspaceId)
  const wLabOrders = labOrders.filter((o: any) => o.encounter?.patientRegistration?.workspaceId === activeWorkspaceId)
  const wLabResults = labResults.filter((r: any) => r.patientRegistration?.workspaceId === activeWorkspaceId)
  const wPrescriptions = prescriptions.filter((p: any) => p.workspaceId === activeWorkspaceId)

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-6rem)]">
      <div className="w-full md:w-64 shrink-0 space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-slate-500 uppercase px-2">Mis Médicos</h2>
        <div className="flex flex-col gap-2">
          {workspaces.map((w: any) => {
            const isActive = w.workspaceId === activeWorkspaceId
            return (
              <button
                type="button"
                key={w.workspaceId}
                onClick={() => {
                  setActiveWorkspaceId(w.workspaceId)
                  setActiveTab("resumen")
                }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left w-full ${
                  isActive 
                    ? "bg-blue-600/10 border-blue-500/30 border shadow-[0_0_15px_rgba(37,99,235,0.1)] text-white" 
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"}`}>
                  <UserCircle size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">Dr. {w.doctor.nombre} {w.doctor.apellido}</p>
                  <p className={`text-[11px] truncate ${isActive ? "text-blue-200" : "text-slate-500"}`}>
                    {w.doctor.especialidadPrincipal}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="mb-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Dr. {activeWorkspace?.doctor.nombre} {activeWorkspace?.doctor.apellido}
              </h1>
              <p className="text-sm text-slate-400 mt-1">{activeWorkspace?.workspaceNombre}</p>
            </div>
            <Link 
              href="/portal/schedule"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all"
            >
              <Calendar size={16} /> Agendar Cita
            </Link>
          </div>
          
          <div className="flex gap-2 border-b border-slate-800 overflow-x-auto no-scrollbar">
            {[
              { id: "resumen", label: "Resumen", icon: UserCircle },
              { id: "documentos", label: "Documentos", icon: FileText },
              { id: "mensajes", label: "Mensajes", icon: MessageSquare },
            ].map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? "border-blue-500 text-white" 
                    : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === "resumen" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 text-emerald-400">
                    <FileText size={20} />
                  </div>
                  <p className="text-2xl font-bold text-white">{wDocs.length + wEncounters.length}</p>
                  <p className="text-xs text-slate-400">Informes</p>
                </div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-2 text-purple-400">
                    <Microscope size={20} />
                  </div>
                  <p className="text-2xl font-bold text-white">{wLabOrders.length + wImagingOrders.length}</p>
                  <p className="text-xs text-slate-400">Órdenes</p>
                </div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 text-blue-400">
                    <Pill size={20} />
                  </div>
                  <p className="text-2xl font-bold text-white">{wPrescriptions.length}</p>
                  <p className="text-xs text-slate-400">Recetas</p>
                </div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-2 text-amber-400">
                    <Calendar size={20} />
                  </div>
                  <p className="text-2xl font-bold text-white">{wAppointments.length}</p>
                  <p className="text-xs text-slate-400">Citas</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" /> Próximas Citas
                </h3>
                <PortalAppointmentsClient initialAppointments={wAppointments} />
              </div>
            </div>
          )}

          {activeTab === "documentos" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
                <h3 className="text-lg font-semibold text-white mb-6">Historial de Consultas y Documentos</h3>
                {wEncounters.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay consultas registradas aún.</p>
                ) : (
                  <div className="space-y-8">
                    {wEncounters.map((e: any) => {
                      const encDocs = wDocs.filter((d: any) => d.encounterId === e.id)
                      const encLabOrders = wLabOrders.filter((o: any) => o.encounterId === e.id)
                      const encImgOrders = wImagingOrders.filter((o: any) => o.encounterId === e.id)
                      const encPrescriptions = wPrescriptions.filter((p: any) => p.encounterId === e.id)

                      return (
                        <div key={e.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-slate-800">
                          <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="text-base font-semibold text-white">Consulta Médica</h4>
                              <p className="text-sm text-slate-400">{new Date(e.createdAt).toLocaleDateString("es-VE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                            </div>
                            <a href={`/api/pdf/encounter/${e.id}?preview=1`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-500/20 w-fit">
                              <FileText size={14} className="mr-2" />
                              Ver Informe
                            </a>
                          </div>

                          {/* Related Documents Grid */}
                          {(encDocs.length > 0 || encLabOrders.length > 0 || encImgOrders.length > 0 || encPrescriptions.length > 0) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {encDocs.map((d: any) => (
                                <a key={d.id} href={`/api/pdf/document/${d.id}?preview=1`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="text-emerald-500/70"><FileText size={18} /></div>
                                    <p className="text-sm text-slate-300 truncate">{TIPO_LABEL[d.tipo] ?? d.tipo}</p>
                                  </div>
                                </a>
                              ))}
                              
                              {encPrescriptions.map((p: any) => (
                                <a key={p.id} href={`/api/pdf/prescription/${p.id}?preview=1`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="text-blue-500/70"><Pill size={18} /></div>
                                    <p className="text-sm text-slate-300 truncate">Receta Médica</p>
                                  </div>
                                </a>
                              ))}
                              
                              {encLabOrders.map((o: any) => (
                                <a key={o.id} href={`/api/pdf/lab-order/${o.id}?preview=1`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="text-purple-500/70"><Microscope size={18} /></div>
                                    <p className="text-sm text-slate-300 truncate">Órdenes de Lab.</p>
                                  </div>
                                </a>
                              ))}

                              {encImgOrders.map((o: any) => (
                                <a key={o.id} href={`/api/pdf/imaging-order/${o.id}?preview=1`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="text-purple-500/70"><Syringe size={18} /></div>
                                    <p className="text-sm text-slate-300 truncate">Órdenes de Imag.</p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "mensajes" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <PortalMensajesClient activeWorkspaceId={activeWorkspaceId} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
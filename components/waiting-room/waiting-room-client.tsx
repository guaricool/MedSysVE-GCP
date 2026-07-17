"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { useRouter } from "next/navigation"
import {
  Users, UserCheck, Clock, CheckCircle2, X, Bell, Stethoscope, Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type UserRole = "DOCTOR" | "STAFF" | string

interface Props {
  role: UserRole
}

const ESTADO_CONFIG = {
  ESPERANDO: { label: "Esperando", cls: "bg-amber-900/40 text-amber-300 border-amber-700" },
  ATENDIENDO: { label: "En consulta", cls: "bg-blue-900/40 text-blue-300 border-blue-700" },
  LISTO: { label: "Atendido", cls: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
}

function minutesWaiting(llegadaAt: string) {
  return Math.floor((Date.now() - new Date(llegadaAt).getTime()) / 60000)
}

export function WaitingRoomClient({ role }: Props) {
  const router = useRouter()
  const utils = trpc.useUtils()

  const { data: queue, isLoading } = (trpc.waitingRoom as any).today.useQuery(undefined, {
    refetchInterval: 20000,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [checkinNotes, setCheckinNotes] = useState("")
  const [showCheckin, setShowCheckin] = useState(false)

  const patientSearch = (trpc.patient as any).search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 },
  )

  const checkin = (trpc.waitingRoom as any).checkin.useMutation({
    onSuccess: () => {
      ;(utils.waitingRoom as any).today.invalidate()
      setShowCheckin(false)
      setSearchQuery("")
      setCheckinNotes("")
    },
    onError: (err: { message: string }) => alert(err.message),
  })

  const call = (trpc.waitingRoom as any).callPatient.useMutation({
    onSuccess: () => (utils.waitingRoom as any).today.invalidate(),
  })

  const done = (trpc.waitingRoom as any).done.useMutation({
    onSuccess: () => (utils.waitingRoom as any).today.invalidate(),
  })

  const remove = (trpc.waitingRoom as any).remove.useMutation({
    onSuccess: () => (utils.waitingRoom as any).today.invalidate(),
  })

  const createEncounter = (trpc.encounter as any).create.useMutation({
    onSuccess: (enc: { id: string }, vars: { patientRegistrationId: string }) => {
      router.push(`/doctor/patients/${vars.patientRegistrationId}/encounters/${enc.id}`)
    },
  })

  const queueList = (queue as any[]) ?? []
  const waiting = queueList.filter((e) => e.estado === "ESPERANDO")
  const attending = queueList.filter((e) => e.estado === "ATENDIENDO")
  const done_ = queueList.filter((e) => e.estado === "LISTO")

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-4 text-center">
          <p className="text-2xl font-bold text-amber-300">{waiting.length}</p>
          <p className="mt-1 text-xs text-amber-500">Esperando</p>
        </div>
        <div className="rounded-lg border border-blue-800/50 bg-blue-950/30 p-4 text-center">
          <p className="text-2xl font-bold text-blue-300">{attending.length}</p>
          <p className="mt-1 text-xs text-blue-500">En consulta</p>
        </div>
        <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-300">{done_.length}</p>
          <p className="mt-1 text-xs text-emerald-500">Atendidos hoy</p>
        </div>
      </div>

      {/* Check-in panel (staff + doctor) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <UserCheck size={15} className="text-emerald-400" />
            Registrar llegada
          </h2>
          <button
            onClick={() => setShowCheckin(!showCheckin)}
            className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            {showCheckin ? "Cancelar" : "+ Check-in"}
          </button>
        </div>

        {showCheckin && (
          <div className="space-y-3 border-t border-slate-800 pt-3">
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Buscar paciente por nombre o cédula</p>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej: García, V-12345678"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {patientSearch.data && (patientSearch.data as any[]).length > 0 && (
              <ul className="space-y-1.5">
                {(patientSearch.data as any[]).map((p: any) => (
                  <li key={p.id}>
                    <button
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-left hover:bg-slate-700 transition-colors"
                      onClick={() =>
                        checkin.mutate({
                          patientRegistrationId: p.id,
                          notas: checkinNotes || undefined,
                        })
                      }
                      disabled={checkin.isPending}
                    >
                      <p className="text-sm font-medium text-white">
                        {p.patient.nombre} {p.patient.apellido}
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.idDisplay}
                        {p.patient.numeroIdentificacion && ` · CI: ${p.patient.numeroIdentificacion}`}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {searchQuery.length >= 2 && patientSearch.data?.length === 0 && (
              <p className="text-xs text-slate-500">Sin resultados para "{searchQuery}"</p>
            )}

            <Input
              value={checkinNotes}
              onChange={(e) => setCheckinNotes(e.target.value)}
              placeholder="Notas opcionales (motivo, urgencia...)"
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
        )}
      </div>

      {/* Queue */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Users size={15} className="text-slate-400" />
          Cola de hoy
        </h2>

        {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}

        {!isLoading && queueList.length === 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-8 text-center">
            <p className="text-slate-500">Sala de espera vacía.</p>
            <p className="mt-1 text-xs text-slate-600">Registra la llegada de un paciente con "+ Check-in".</p>
          </div>
        )}

        {queueList.map((entry: any) => {
          const estadoInfo = ESTADO_CONFIG[entry.estado as keyof typeof ESTADO_CONFIG] ?? { label: entry.estado, cls: "bg-slate-800 text-slate-300 border-slate-700" }
          const mins = minutesWaiting(entry.llegadaAt)
          const isLong = entry.estado === "ESPERANDO" && mins > 30

          return (
            <div
              key={entry.id}
              className={`rounded-xl border p-4 transition-colors ${
                entry.estado === "ATENDIENDO"
                  ? "border-blue-800/60 bg-blue-950/20"
                  : entry.estado === "LISTO"
                    ? "border-slate-800 bg-slate-900/30 opacity-60"
                    : isLong
                      ? "border-red-800/50 bg-red-950/10"
                      : "border-slate-800 bg-slate-900/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Turno badge */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
                    {entry.turno}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {entry.patientRegistration.patient.nombre}{" "}
                      {entry.patientRegistration.patient.apellido}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className={`rounded border px-1.5 py-0.5 text-xs font-medium ${estadoInfo.cls}`}>
                        {estadoInfo.label}
                      </span>
                      <span className={`flex items-center gap-1 text-xs ${isLong ? "text-red-400" : "text-slate-500"}`}>
                        <Clock size={11} />
                        {mins} min
                      </span>
                      {entry.notas && (
                        <span className="text-xs text-slate-500">{entry.notas}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {role === "DOCTOR" && entry.estado === "ESPERANDO" && (
                    <button
                      title="Llamar paciente"
                      disabled={call.isPending}
                      onClick={() => call.mutate({ id: entry.id })}
                      className="flex items-center gap-1 rounded border border-blue-700 bg-blue-900/30 px-2 py-1.5 text-xs text-blue-300 hover:bg-blue-900/50 disabled:opacity-50"
                    >
                      <Bell size={12} />
                      Llamar
                    </button>
                  )}
                  {role === "DOCTOR" && entry.estado === "ATENDIENDO" && (
                    <button
                      title="Iniciar consulta"
                      disabled={createEncounter.isPending}
                      onClick={() =>
                        createEncounter.mutate({
                          patientRegistrationId: entry.patientRegistrationId,
                          appointmentId: entry.appointmentId ?? undefined,
                        })
                      }
                      className="flex items-center gap-1 rounded border border-emerald-700 bg-emerald-900/30 px-2 py-1.5 text-xs text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-50"
                    >
                      <Stethoscope size={12} />
                      Consulta
                    </button>
                  )}
                  {entry.estado !== "LISTO" && entry.estado !== "RETIRADO" && (
                    <button
                      title="Marcar como atendido"
                      disabled={done.isPending}
                      onClick={() => done.mutate({ id: entry.id })}
                      className="rounded border border-slate-700 p-1.5 text-slate-500 hover:border-emerald-700 hover:text-emerald-400 disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                  <button
                    title="Retirar de lista"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate({ id: entry.id })}
                    className="rounded border border-slate-700 p-1.5 text-slate-500 hover:border-red-800 hover:text-red-400 disabled:opacity-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-600">Actualización automática cada 20 segundos</p>
    </div>
  )
}

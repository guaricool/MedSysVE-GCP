"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Solicitada",
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
  COMPLETED: "Completada",
}

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "text-purple-400",
  SCHEDULED: "text-yellow-400",
  CONFIRMED: "text-green-400",
  CANCELLED: "text-red-400",
  NO_SHOW: "text-slate-400",
  COMPLETED: "text-blue-400",
}

const TIPO_LABEL: Record<string, string> = {
  CONSULTA: "Consulta",
  SEGUIMIENTO: "Seguimiento",
  EMERGENCIA: "Emergencia",
  PROCEDIMIENTO: "Procedimiento",
  VIDEOCONSULTA: "Videoconsulta",
}

interface Appointment {
  id: string
  tipo: string
  status: string
  fechaHora: Date | string
  duracionMinutos: number
  notas: string | null
  titulo: string | null
}

interface Props {
  initialAppointments: Appointment[]
}

export function PortalAppointmentsClient({ initialAppointments }: Props) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [rescheduling, setRescheduling] = useState<string | null>(null)
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")

  const cancelMutation = trpc.portal.cancelAppointment.useMutation({
    onSuccess: (_, vars) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === vars.id ? { ...a, status: "CANCELLED" } : a))
      )
      setCancelling(null)
    },
    onError: (e) => {
      alert(e.message)
      setCancelling(null)
    },
  })

  const rescheduleMutation = (trpc.portal as any).rescheduleAppointment.useMutation({
    onSuccess: (newAppt: any) => {
      setAppointments((prev) =>
        prev
          .map((a) => (a.id === rescheduling ? { ...a, status: "CANCELLED" } : a))
          .concat([{ ...newAppt, status: "REQUESTED" }])
      )
      setRescheduling(null)
      setNewDate("")
      setNewTime("")
    },
    onError: (e: any) => {
      alert(e.message)
    },
  })

  function handleCancel(id: string) {
    if (!confirm("¿Confirmar cancelación de esta cita?")) return
    setCancelling(id)
    cancelMutation.mutate({ id })
  }

  if (appointments.length === 0) {
    return <p className="text-sm text-slate-400">No tiene citas registradas.</p>
  }

  return (
    <ul className="space-y-3">
      {appointments.map((a) => {
        const canCancel = a.status === "REQUESTED" || a.status === "SCHEDULED"
        const isFuture = new Date(a.fechaHora) > new Date()
        const isRescheduling = rescheduling === a.id
        return (
          <li
            key={a.id}
            className="rounded-md border border-slate-800 bg-slate-900 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">
                  {a.titulo ?? TIPO_LABEL[a.tipo] ?? a.tipo}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(a.fechaHora).toLocaleString("es-VE", {
                    dateStyle: "long",
                    timeStyle: "short",
                    timeZone: 'America/Caracas',
                  })}
                  {" · "}
                  {a.duracionMinutos} min
                </p>
                {a.notas && (
                  <p className="mt-0.5 text-xs text-slate-500">{a.notas}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-sm font-medium ${STATUS_COLOR[a.status] ?? "text-slate-400"}`}>
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
                {canCancel && isFuture && !isRescheduling && (
                  <>
                    <button
                      onClick={() => { setRescheduling(a.id); setNewDate(""); setNewTime("") }}
                      className="rounded border border-amber-800 px-2 py-0.5 text-xs text-amber-400 hover:bg-amber-900/30"
                    >
                      Reprogramar
                    </button>
                    <button
                      onClick={() => handleCancel(a.id)}
                      disabled={cancelling === a.id}
                      className="rounded border border-red-800 px-2 py-0.5 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                    >
                      {cancelling === a.id ? "..." : "Cancelar"}
                    </button>
                  </>
                )}
                {a.tipo === "VIDEOCONSULTA" && (a.status === "SCHEDULED" || a.status === "CONFIRMED") && (
                  <a
                    href={`https://meet.jit.si/medsysve-${a.id.slice(-10)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded border border-violet-800 px-2 py-0.5 text-xs text-violet-400 hover:bg-violet-900/20"
                  >
                    Videoconsulta
                  </a>
                )}
              </div>
            </div>

            {isRescheduling && (
              <div className="mt-3 flex items-end gap-2 flex-wrap border-t border-slate-800 pt-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Nueva fecha</p>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Hora</p>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                  />
                </div>
                <button
                  disabled={!newDate || !newTime || rescheduleMutation.isPending}
                  onClick={() => rescheduleMutation.mutate({ appointmentId: a.id, newFechaHora: `${newDate}T${newTime}:00` })}
                  className="rounded bg-amber-700 px-2 py-1 text-xs text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {rescheduleMutation.isPending ? "..." : "Confirmar"}
                </button>
                <button
                  onClick={() => setRescheduling(null)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Cancelar
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

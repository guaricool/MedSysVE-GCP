"use client"

import { useState } from "react"
import Link from "next/link"
import { trpc } from "@/lib/trpc-client"

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Solicitada",
  SCHEDULED: "Agendada",
  CONFIRMED: "Llegó",
  NO_SHOW: "No asistió",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
}

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "bg-purple-900/40 text-purple-400",
  SCHEDULED: "bg-amber-900/40 text-amber-400",
  CONFIRMED: "bg-emerald-900/40 text-emerald-400",
  NO_SHOW: "bg-slate-800 text-slate-500",
  COMPLETED: "bg-blue-900/40 text-blue-400",
  CANCELLED: "bg-red-900/40 text-red-400",
}

const TIPO_LABEL: Record<string, string> = {
  CONSULTA: "Consulta",
  SEGUIMIENTO: "Seguimiento",
  EMERGENCIA: "Emergencia",
  PROCEDIMIENTO: "Procedimiento",
}

export function NurseDashboardClient() {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString()
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()

  const { data: appointments = [], refetch } = trpc.appointment.list.useQuery({ from, to })
  const markArrival = trpc.appointment.markArrival.useMutation({ onSuccess: () => refetch() })

  const [today_label] = useState(() =>
    new Date().toLocaleDateString("es-VE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: 'America/Caracas',
    })
  )

  const counts = {
    total: appointments.length,
    arrived: appointments.filter((a) => a.status === "CONFIRMED" || a.status === "COMPLETED").length,
    pending: appointments.filter((a) => a.status === "SCHEDULED" || a.status === "REQUESTED").length,
    noShow: appointments.filter((a) => a.status === "NO_SHOW").length,
  }

  return (
    <div className="space-y-5">
      {/* Date + summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="capitalize text-sm text-slate-400">{today_label}</p>
        <div className="flex gap-3 text-sm">
          <span className="text-slate-400">
            Total: <span className="text-white font-semibold">{counts.total}</span>
          </span>
          <span className="text-emerald-400">
            Llegaron: <span className="font-semibold">{counts.arrived}</span>
          </span>
          <span className="text-amber-400">
            Esperando: <span className="font-semibold">{counts.pending}</span>
          </span>
          {counts.noShow > 0 && (
            <span className="text-slate-500">
              No asistió: <span className="font-semibold">{counts.noShow}</span>
            </span>
          )}
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400 text-sm">No hay citas programadas para hoy.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {appointments.map((appt) => {
            const pat = appt.patientRegistration?.patient
            const isPending = appt.status === "SCHEDULED" || appt.status === "REQUESTED"
            const isActive = isPending || appt.status === "CONFIRMED"

            return (
              <li
                key={appt.id}
                className={`rounded-lg border p-3 flex flex-wrap items-center gap-3 transition-colors ${
                  appt.status === "NO_SHOW" || appt.status === "CANCELLED"
                    ? "border-slate-800 bg-slate-900/30 opacity-60"
                    : "border-slate-800 bg-slate-900/60"
                }`}
              >
                {/* Time */}
                <div className="w-14 text-center shrink-0">
                  <p className="text-white font-mono text-sm font-semibold">
                    {new Date(appt.fechaHora).toLocaleTimeString("es-VE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: 'America/Caracas',
                    })}
                  </p>
                  <p className="text-slate-500 text-xs">{appt.duracionMinutos}min</p>
                </div>

                {/* Patient info */}
                <div className="flex-1 min-w-0">
                  {pat ? (
                    <>
                      <p className="text-white font-medium truncate">
                        {pat.nombre} {pat.apellido}
                      </p>
                      <p className="text-xs text-slate-400">
                        {appt.titulo ?? TIPO_LABEL[appt.tipo] ?? appt.tipo}
                        {pat.telefono && (
                          <span className="ml-2 text-slate-500">· {pat.telefono}</span>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-400 italic text-sm">
                      {appt.titulo ?? TIPO_LABEL[appt.tipo] ?? appt.tipo}
                    </p>
                  )}
                  {appt.notas && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{appt.notas}</p>
                  )}
                </div>

                {/* Status badge */}
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                    STATUS_COLOR[appt.status] ?? "bg-slate-800 text-slate-400"
                  }`}
                >
                  {STATUS_LABEL[appt.status] ?? appt.status}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isPending && (
                    <button
                      type="button"
                      disabled={markArrival.isPending}
                      onClick={() => markArrival.mutate({ id: appt.id, status: "CONFIRMED" })}
                      className="rounded bg-emerald-700 px-2 py-1 text-xs text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      Llegó
                    </button>
                  )}
                  {isActive && (
                    <button
                      type="button"
                      disabled={markArrival.isPending}
                      onClick={() => markArrival.mutate({ id: appt.id, status: "NO_SHOW" })}
                      className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-50"
                    >
                      No asistió
                    </button>
                  )}
                  {appt.patientRegistration?.id && (
                    <Link
                      href={`/doctor/patients/${appt.patientRegistration.id}`}
                      className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800"
                    >
                      Ver historial
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

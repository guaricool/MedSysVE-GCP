"use client"

import Link from "next/link"
import { trpc } from "@/lib/trpc-client"

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "text-purple-400",
  SCHEDULED: "text-amber-400",
  CONFIRMED: "text-emerald-400",
  NO_SHOW: "text-slate-500",
  COMPLETED: "text-blue-400",
  CANCELLED: "text-red-400",
}

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Solicitada",
  SCHEDULED: "Agendada",
  CONFIRMED: "Llegó",
  NO_SHOW: "No asistió",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
}

export function AssistantDashboardClient() {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString()
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()

  const { data: appointments = [] } = trpc.appointment.list.useQuery({ from, to })
  const { data: upcoming = [] } = trpc.appointment.listUpcoming.useQuery()

  const pending = appointments.filter((a) => a.status === "SCHEDULED" || a.status === "REQUESTED")
  const done = appointments.filter((a) => a.status === "COMPLETED")

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-center">
          <p className="text-2xl font-bold text-white">{appointments.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Citas hoy</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{pending.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Pendientes</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{done.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Completadas</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/doctor/patients"
          className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-center text-sm text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
        >
          Buscar paciente
        </Link>
        <Link
          href="/doctor/patients/new"
          className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-center text-sm text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
        >
          Registrar paciente
        </Link>
      </div>

      {/* Today's appointments */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Citas de hoy ({appointments.length})
        </h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-500">No hay citas programadas para hoy.</p>
        ) : (
          <ul className="space-y-1.5">
            {appointments.map((appt) => {
              const pat = appt.patientRegistration?.patient
              return (
                <li
                  key={appt.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5"
                >
                  <span className="w-11 shrink-0 font-mono text-xs text-slate-400">
                    {new Date(appt.fechaHora).toLocaleTimeString("es-VE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: 'America/Caracas',
                    })}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {pat ? `${pat.nombre} ${pat.apellido}` : (appt.titulo ?? "Sin paciente")}
                    </p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${STATUS_COLOR[appt.status] ?? "text-slate-400"}`}>
                    {STATUS_LABEL[appt.status] ?? appt.status}
                  </span>
                  {appt.patientRegistration?.id && (
                    <Link
                      href={`/doctor/patients/${appt.patientRegistration.id}`}
                      className="shrink-0 rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800"
                    >
                      Ver
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Upcoming (next 3 days) */}
      {upcoming.filter((a) => {
        const d = new Date(a.fechaHora)
        return d > new Date(to)
      }).length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Próximas citas
          </h2>
          <ul className="space-y-1.5">
            {upcoming
              .filter((a) => new Date(a.fechaHora) > new Date(to))
              .slice(0, 5)
              .map((appt) => {
                const pat = appt.patientRegistration?.patient
                return (
                  <li
                    key={appt.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2"
                  >
                    <span className="text-xs text-slate-500 shrink-0 w-20">
                      {new Date(appt.fechaHora).toLocaleDateString("es-VE", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        timeZone: 'America/Caracas',
                      })}
                    </span>
                    <p className="flex-1 text-sm text-slate-300 truncate">
                      {pat ? `${pat.nombre} ${pat.apellido}` : (appt.titulo ?? "Sin paciente")}
                    </p>
                    <span className="text-xs text-slate-500 shrink-0">
                      {new Date(appt.fechaHora).toLocaleTimeString("es-VE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: 'America/Caracas',
                      })}
                    </span>
                  </li>
                )
              })}
          </ul>
        </section>
      )}
    </div>
  )
}

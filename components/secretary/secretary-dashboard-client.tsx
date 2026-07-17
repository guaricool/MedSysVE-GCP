"use client"

import Link from "next/link"
import { trpc } from "@/lib/trpc-client"

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Solicitada",
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  NO_SHOW: "No asistió",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
}

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "text-purple-400",
  SCHEDULED: "text-amber-400",
  CONFIRMED: "text-emerald-400",
  NO_SHOW: "text-slate-500",
  COMPLETED: "text-blue-400",
  CANCELLED: "text-red-400",
}

const TIPO_LABEL: Record<string, string> = {
  CONSULTA: "Consulta",
  SEGUIMIENTO: "Seguimiento",
  EMERGENCIA: "Emergencia",
  PROCEDIMIENTO: "Procedimiento",
}

export function SecretaryDashboardClient() {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString()
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()

  const { data: appointments = [] } = trpc.appointment.list.useQuery({ from, to })
  const { data: invoices = [] } = trpc.invoice.list.useQuery({ status: "PENDING" })
  const { data: patients = [] } = trpc.patient.list.useQuery()

  const todayLabel = today.toLocaleDateString("es-VE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: 'America/Caracas',
  })

  const scheduled = appointments.filter(
    (a) => a.status === "SCHEDULED" || a.status === "CONFIRMED" || a.status === "REQUESTED"
  ).length
  const completed = appointments.filter((a) => a.status === "COMPLETED").length

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Citas hoy" value={appointments.length} sub={`${scheduled} pendientes`} />
        <StatCard label="Completadas" value={completed} sub="hoy" green />
        <StatCard label="Facturas pendientes" value={invoices.length} sub="por cobrar" yellow />
        <StatCard label="Pacientes" value={patients.length} sub="registrados" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/doctor/appointments", label: "Ver agenda completa" },
          { href: "/doctor/patients/new", label: "Registrar paciente" },
          { href: "/doctor/billing", label: "Ir a facturación" },
          { href: "/doctor/patients", label: "Buscar paciente" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-center text-sm text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Today's appointments */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400 capitalize">
          {todayLabel}
        </h2>
        {appointments.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-6 text-center">
            <p className="text-slate-500 text-sm">No hay citas programadas para hoy.</p>
            <Link href="/doctor/appointments" className="mt-2 inline-block text-sm text-blue-400 hover:underline">
              Ir a la agenda →
            </Link>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {appointments.map((appt) => {
              const pat = appt.patientRegistration?.patient
              return (
                <li
                  key={appt.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5"
                >
                  <span className="w-12 text-right font-mono text-sm text-slate-400 shrink-0">
                    {new Date(appt.fechaHora).toLocaleTimeString("es-VE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: 'America/Caracas',
                    })}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {pat ? `${pat.nombre} ${pat.apellido}` : (appt.titulo ?? "Sin paciente")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {TIPO_LABEL[appt.tipo] ?? appt.tipo}
                      {appt.duracionMinutos ? ` · ${appt.duracionMinutos} min` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${STATUS_COLOR[appt.status] ?? "text-slate-400"}`}>
                    {STATUS_LABEL[appt.status] ?? appt.status}
                  </span>
                  {appt.patientRegistration?.id && (
                    <Link
                      href={`/doctor/patients/${appt.patientRegistration.id}`}
                      className="shrink-0 text-xs text-slate-600 hover:text-slate-400"
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

      {/* Pending invoices */}
      {invoices.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Facturas pendientes ({invoices.length})
            </h2>
            <Link href="/doctor/billing" className="text-xs text-blue-400 hover:underline">
              Ver todas →
            </Link>
          </div>
          <ul className="space-y-1.5">
            {invoices.slice(0, 5).map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {inv.patientRegistration.patient.nombre} {inv.patientRegistration.patient.apellido}
                  </p>
                  <p className="text-xs text-slate-500">
                    {inv.numero} · {new Date(inv.createdAt).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-amber-400">
                  ${Number(inv.montoUsd).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  green,
  yellow,
}: {
  label: string
  value: number
  sub: string
  green?: boolean
  yellow?: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${green ? "text-emerald-400" : yellow ? "text-amber-400" : "text-white"}`}>
        {value}
      </p>
      <p className="text-xs text-slate-600">{sub}</p>
    </div>
  )
}

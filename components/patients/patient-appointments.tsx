"use client"

import { trpc } from "@/lib/trpc-client"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const TIPO_LABEL: Record<string, string> = {
  CONSULTA: "Consulta",
  SEGUIMIENTO: "Seguimiento",
  EMERGENCIA: "Emergencia",
  PROCEDIMIENTO: "Procedimiento",
  VIDEOCONSULTA: "Videoconsulta",
}

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Solicitada",
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
  COMPLETED: "Completada",
}

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "bg-yellow-900/40 text-yellow-400",
  SCHEDULED: "bg-blue-900/40 text-blue-400",
  CONFIRMED: "bg-emerald-900/40 text-emerald-400",
  CANCELLED: "bg-slate-800 text-slate-500",
  NO_SHOW: "bg-red-900/40 text-red-400",
  COMPLETED: "bg-slate-800 text-slate-400",
}

interface Props {
  patientRegistrationId: string
}

export function PatientAppointments({ patientRegistrationId }: Props) {
  const { data, isLoading } = trpc.appointment.listByPatient.useQuery({ patientRegistrationId })

  if (isLoading) {
    return <p className="text-sm text-slate-500">Cargando citas...</p>
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500">Sin citas registradas.</p>
  }

  return (
    <ul className="space-y-2">
      {data.map((appt) => (
        <li
          key={appt.id}
          className="flex items-start justify-between gap-4 rounded-md border border-slate-800 bg-slate-950 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">
              {appt.titulo ?? TIPO_LABEL[appt.tipo] ?? appt.tipo}
            </p>
            <p className="text-xs text-slate-400">
              {format(new Date(appt.fechaHora), "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })}
              {" · "}
              {appt.duracionMinutos} min
            </p>
            {appt.notas && (
              <p className="mt-0.5 text-xs text-slate-500 truncate">{appt.notas}</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[appt.status] ?? "bg-slate-800 text-slate-400"}`}
          >
            {STATUS_LABEL[appt.status] ?? appt.status}
          </span>
        </li>
      ))}
    </ul>
  )
}

"use client"

import { useState, Fragment } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Plus, X, Clock, MessageCircle, User } from "lucide-react"

type AppointmentStatus = "REQUESTED" | "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "NO_SHOW" | "COMPLETED"
type AppointmentType = "CONSULTA" | "SEGUIMIENTO" | "EMERGENCIA" | "PROCEDIMIENTO" | "VIDEOCONSULTA"

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  REQUESTED: "Solicitada",
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
  COMPLETED: "Completada",
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  REQUESTED: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  SCHEDULED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CONFIRMED: "bg-green-500/20 text-green-300 border-green-500/30",
  CANCELLED: "bg-slate-500/20 text-slate-400 border-slate-500/30 line-through",
  NO_SHOW: "bg-red-500/20 text-red-300 border-red-500/30",
  COMPLETED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
}

const TYPE_LABELS: Record<AppointmentType, string> = {
  CONSULTA: "Consulta",
  SEGUIMIENTO: "Seguimiento",
  EMERGENCIA: "Emergencia",
  PROCEDIMIENTO: "Procedimiento",
  VIDEOCONSULTA: "Videoconsulta",
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatHHMM(date: Date): string {
  return date.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: 'America/Caracas' })
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("es-VE", { weekday: "short", day: "numeric", month: "short", timeZone: 'America/Caracas' })
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7am–7pm

export function AppointmentsClient() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [showForm, setShowForm] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null)
  const [calendarView, setCalendarView] = useState<"week" | "agenda">("week")

  const weekEnd = addDays(weekStart, 6)
  weekEnd.setHours(23, 59, 59, 999)

  const { data: appts = [], refetch } = trpc.appointment.list.useQuery({
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
  })

  const agendaStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d })()
  const agendaEnd = addDays(agendaStart, 30)
  agendaEnd.setHours(23, 59, 59, 999)
  const { data: agendaAppts } = trpc.appointment.list.useQuery(
    { from: agendaStart.toISOString(), to: agendaEnd.toISOString() },
    { enabled: calendarView === "agenda" },
  )

  const router = useRouter()
  const [reminderMsg, setReminderMsg] = useState<{ id: string; msg: string } | null>(null)
  const updateAppt = trpc.appointment.update.useMutation({ onSuccess: () => refetch() })
  const deleteAppt = trpc.appointment.delete.useMutation({ onSuccess: () => refetch() })
  const sendReminder = (trpc.appointment as any).sendReminder.useMutation({
    onSuccess: (data: any, vars: any) => {
      setReminderMsg({
        id: vars.id,
        msg: data.sent ? `Recordatorio enviado a ${data.phone}` : `No enviado: ${data.error ?? "sin teléfono"}`,
      })
      setTimeout(() => setReminderMsg(null), 4000)
    },
  })
  const createEncounter = trpc.encounter.create.useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess: (enc: any) => {
      router.push(`/doctor/patients/${enc.patientRegistrationId}/encounters/${enc.id}`)
    },
  })

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function apptsByDay(day: Date) {
    return appts.filter((a) => {
      const d = new Date(a.fechaHora)
      return d.toDateString() === day.toDateString()
    })
  }

  const selected = selectedAppt ? appts.find((a) => a.id === selectedAppt) : null

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="p-2 rounded-md border border-slate-700 text-slate-400 hover:bg-slate-800"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-slate-300 text-sm font-medium">
            {weekStart.toLocaleDateString("es-VE", { day: "numeric", month: "long", timeZone: 'America/Caracas' })} —{" "}
            {weekEnd.toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric", timeZone: 'America/Caracas' })}
          </span>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="p-2 rounded-md border border-slate-700 text-slate-400 hover:bg-slate-800"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="px-3 py-1.5 rounded-md border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs"
          >
            Hoy
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setCalendarView("week")}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                calendarView === "week" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setCalendarView("agenda")}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                calendarView === "agenda" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Agenda
            </button>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={14} className="mr-1.5" />
            Nueva cita
          </Button>
        </div>
      </div>

      {/* Agenda view */}
      {calendarView === "agenda" && (
        <div className="space-y-4 py-2">
          {(!agendaAppts || agendaAppts.length === 0) && (
            <p className="text-slate-500 text-sm text-center py-8">Sin citas en los próximos 30 días</p>
          )}
          {agendaAppts && agendaAppts.length > 0 && (() => {
            const byDate = new Map<string, typeof agendaAppts>()
            for (const appt of agendaAppts) {
              const key = new Date(appt.fechaHora).toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long", timeZone: 'America/Caracas' })
              if (!byDate.has(key)) byDate.set(key, [])
              byDate.get(key)!.push(appt)
            }
            return Array.from(byDate.entries()).map(([fecha, dayAppts]) => (
              <div key={fecha}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 capitalize">{fecha}</p>
                <div className="space-y-1">
                  {dayAppts.map((appt) => (
                    <button
                      key={appt.id}
                      onClick={() => setSelectedAppt(appt.id === selectedAppt ? null : appt.id)}
                      className="w-full text-left rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 px-3 py-2 transition flex items-center gap-3"
                    >
                      <span className="text-slate-400 text-xs w-12 flex-shrink-0 font-mono">
                        {new Date(appt.fechaHora).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: 'America/Caracas' })}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {appt.patientRegistration
                            ? `${appt.patientRegistration.patient.nombre} ${appt.patientRegistration.patient.apellido}`
                            : appt.titulo ?? TYPE_LABELS[appt.tipo as AppointmentType]}
                        </p>
                        <p className="text-xs text-slate-500">
                          {TYPE_LABELS[appt.tipo as AppointmentType]} · {appt.duracionMinutos} min
                        </p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[appt.status as AppointmentStatus]}`}>
                        {STATUS_LABELS[appt.status as AppointmentStatus]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          })()}
        </div>
      )}

      {/* Calendar grid */}
      {calendarView === "week" && <>
      <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-x-auto">
        <div className="grid grid-cols-8 min-w-[700px]">
          {/* Header row */}
          <div className="border-b border-slate-800 p-2" />
          {days.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString()
            return (
              <div
                key={i}
                className={`border-b border-l border-slate-800 p-2 text-center text-xs font-medium ${isToday ? "text-blue-400" : "text-slate-400"}`}
              >
                <div className="uppercase">{day.toLocaleDateString("es-VE", { weekday: "short", timeZone: 'America/Caracas' })}</div>
                <div className={`text-base ${isToday ? "text-blue-300 font-bold" : "text-slate-200"}`}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <Fragment key={hour}>
              <div
                key={`h-${hour}`}
                className="border-b border-slate-800/50 p-2 text-right pr-3 text-xs text-slate-600"
              >
                {String(hour).padStart(2, "0")}:00
              </div>
              {days.map((day, di) => {
                const slotAppts = apptsByDay(day).filter((a) => new Date(a.fechaHora).getHours() === hour)
                return (
                  <div
                    key={`${hour}-${di}`}
                    className="border-b border-l border-slate-800/50 min-h-[48px] p-0.5 relative"
                  >
                    {slotAppts.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAppt(a.id === selectedAppt ? null : a.id)}
                        className={`w-full text-left rounded px-1.5 py-0.5 text-xs border mb-0.5 ${STATUS_COLORS[a.status as AppointmentStatus]}`}
                      >
                        <div className="font-medium truncate">
                          {a.patientRegistration
                            ? `${a.patientRegistration.patient.nombre} ${a.patientRegistration.patient.apellido}`
                            : a.titulo ?? TYPE_LABELS[a.tipo as AppointmentType]}
                        </div>
                        <div className="text-[10px] opacity-70">
                          {formatHHMM(new Date(a.fechaHora))} · {a.duracionMinutos}min
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
      </>}

      {/* Appointment detail panel */}
      {selected && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-white">
                {selected.patientRegistration
                  ? `${selected.patientRegistration.patient.nombre} ${selected.patientRegistration.patient.apellido}`
                  : selected.titulo ?? TYPE_LABELS[selected.tipo as AppointmentType]}
              </p>
              <p className="text-sm text-slate-400">
                {new Date(selected.fechaHora).toLocaleDateString("es-VE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: 'America/Caracas',
                })}{" "}
                — {formatHHMM(new Date(selected.fechaHora))}
              </p>
            </div>
            <button onClick={() => setSelectedAppt(null)} className="text-slate-500 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded border ${STATUS_COLORS[selected.status as AppointmentStatus]}`}>
              {STATUS_LABELS[selected.status as AppointmentStatus]}
            </span>
            <span className="px-2 py-0.5 rounded border border-slate-700 text-slate-400">
              {TYPE_LABELS[selected.tipo as AppointmentType]}
            </span>
            <span className="px-2 py-0.5 rounded border border-slate-700 text-slate-400 flex items-center gap-1">
              <Clock size={11} />
              {selected.duracionMinutos} min
            </span>
          </div>

          {selected.notas && <p className="text-sm text-slate-400">{selected.notas}</p>}

          {(selected.status === "SCHEDULED" || selected.status === "CONFIRMED") && selected.patientRegistrationId && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => createEncounter.mutate({ patientRegistrationId: selected.patientRegistrationId!, appointmentId: selected.id })}
                disabled={createEncounter.isPending}
                className="rounded border border-blue-700 bg-blue-900/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-900/50 disabled:opacity-50"
              >
                {createEncounter.isPending ? "Abriendo..." : "Iniciar consulta"}
              </button>
{/* WhatsApp temporalmente desactivado
              <button
                onClick={() => sendReminder.mutate({ id: selected.id })}
                disabled={sendReminder.isPending}
                className="flex items-center gap-1.5 rounded border border-green-700 bg-green-900/20 px-3 py-1.5 text-xs text-green-300 hover:bg-green-900/40 disabled:opacity-50"
              >
                <MessageCircle size={12} />
                {sendReminder.isPending ? "Enviando..." : "Recordatorio WhatsApp"}
              </button>
              {reminderMsg?.id === selected.id && (
                <span className="self-center text-xs text-slate-400 italic">{reminderMsg.msg}</span>
              )}
              */}
            </div>
          )}

          {selected.tipo === "VIDEOCONSULTA" && (
            <div className="flex gap-2 flex-wrap">
              <a
                href={`/doctor/teleconsulta/${selected.id}`}
                className="inline-flex items-center gap-1.5 rounded border border-violet-700 bg-violet-900/20 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-900/40"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
                Sala de teleconsulta
              </a>
              <a
                href={`https://meet.jit.si/medsysve-${selected.id.slice(-10)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Jitsi directo ↗
              </a>
            </div>
          )}

          {(selected.status === "REQUESTED" || selected.status === "SCHEDULED" || selected.status === "CONFIRMED") ? (
            <div className="flex gap-2 flex-wrap">
              {selected.status === "REQUESTED" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-700 text-blue-400 hover:bg-blue-900/30"
                    onClick={() => updateAppt.mutate({ id: selected.id, status: "SCHEDULED" })}
                    disabled={updateAppt.isPending}
                  >
                    Aceptar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-400 hover:bg-slate-800"
                    onClick={() => updateAppt.mutate({ id: selected.id, status: "CANCELLED" })}
                    disabled={updateAppt.isPending}
                  >
                    Rechazar
                  </Button>
                </>
              )}
              {selected.status === "SCHEDULED" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-700 text-green-400 hover:bg-green-900/30"
                  onClick={() => updateAppt.mutate({ id: selected.id, status: "CONFIRMED" })}
                  disabled={updateAppt.isPending}
                >
                  Confirmar
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-700 text-emerald-400 hover:bg-emerald-900/30"
                onClick={() => updateAppt.mutate({ id: selected.id, status: "COMPLETED" })}
                disabled={updateAppt.isPending}
              >
                Completar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-700 text-amber-400 hover:bg-amber-900/30"
                onClick={() => updateAppt.mutate({ id: selected.id, status: "NO_SHOW" })}
                disabled={updateAppt.isPending}
              >
                No asistió
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-400 hover:bg-slate-800"
                onClick={() => { deleteAppt.mutate({ id: selected.id }); setSelectedAppt(null) }}
                disabled={deleteAppt.isPending}
              >
                Eliminar
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {/* New appointment modal */}
      {showForm && <NewAppointmentForm onClose={() => setShowForm(false)} onCreated={() => { refetch(); setShowForm(false) }} />}
    </div>
  )
}

function NewAppointmentForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState<AppointmentType>("CONSULTA")
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [hora, setHora] = useState("09:00")
  const [duracion, setDuracion] = useState(30)
  const [notas, setNotas] = useState("")
  const [patientQuery, setPatientQuery] = useState("")

  const patientSearch = trpc.patient.search.useQuery(
    { query: patientQuery },
    { enabled: patientQuery.trim().length >= 2 },
  )
  const [selectedPatientRegId, setSelectedPatientRegId] = useState<string | null>(null)
  const [selectedPatientName, setSelectedPatientName] = useState("")
  const [repetir, setRepetir] = useState(false)
  const [intervalo, setIntervalo] = useState<"SEMANAL" | "QUINCENAL" | "MENSUAL">("SEMANAL")
  const [cantidad, setCantidad] = useState(4)

  const create = trpc.appointment.create.useMutation({ onSuccess: onCreated })
  const createSeries = trpc.appointment.createSeries.useMutation({ onSuccess: onCreated })

  function handleCreate() {
    if (repetir) {
      createSeries.mutate({
        patientRegistrationId: selectedPatientRegId ?? undefined,
        titulo: titulo || undefined,
        tipo,
        fechaHoraInicial: `${fecha}T${hora}:00`,
        duracionMinutos: duracion,
        notas: notas || undefined,
        intervalo,
        cantidad,
      })
    } else {
      create.mutate({
        patientRegistrationId: selectedPatientRegId ?? undefined,
        titulo: titulo || undefined,
        tipo,
        fechaHora: `${fecha}T${hora}:00`,
        duracionMinutos: duracion,
        notas: notas || undefined,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Nueva Cita</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Paciente</Label>
            {selectedPatientName ? (
              <div className="flex items-center justify-between rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm">
                <span className="text-white flex items-center gap-2">
                  <User size={13} className="text-slate-400" />
                  {selectedPatientName}
                </span>
                <button
                  onClick={() => { setSelectedPatientRegId(null); setSelectedPatientName(""); setPatientQuery("") }}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Buscar paciente (mín. 2 letras)..."
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                {patientSearch.data && patientSearch.data.length > 0 && patientQuery.length >= 2 && (
                  <ul className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-auto rounded-md border border-slate-700 bg-slate-800 shadow-xl">
                    {(patientSearch.data as any[]).map((r) => (
                      <li key={r.id}>
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                          onClick={() => {
                            setSelectedPatientRegId(r.id)
                            setSelectedPatientName(`${r.patient.nombre} ${r.patient.apellido}`)
                            setPatientQuery("")
                          }}
                        >
                          <span className="text-blue-400 font-mono text-xs">#{r.idDisplay}</span>
                          {r.patient.nombre} {r.patient.apellido}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Tipo</Label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as AppointmentType)}
                className="w-full rounded-md bg-slate-800 border border-slate-700 text-white px-3 py-2 text-sm"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Duración (min)</Label>
              <Input
                type="number"
                min={5}
                max={480}
                step={5}
                value={duracion}
                onChange={(e) => setDuracion(Number(e.target.value))}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Fecha</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Hora</Label>
              <Input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Título (opcional si hay paciente)</Label>
            <Input
              placeholder="Ej: Revisión post-operatoria"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Notas</Label>
            <Input
              placeholder="Observaciones para la cita..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2 border-t border-slate-700 pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={repetir}
                onChange={(e) => setRepetir(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800"
              />
              <span className="text-sm text-slate-300">Crear serie de citas recurrentes</span>
            </label>
            {repetir && (
              <div className="flex items-center gap-3 pl-6">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Repetir cada</label>
                  <select
                    value={intervalo}
                    onChange={(e) => setIntervalo(e.target.value as typeof intervalo)}
                    className="rounded bg-slate-800 border border-slate-700 text-white px-2 py-1 text-sm"
                  >
                    <option value="SEMANAL">Semana</option>
                    <option value="QUINCENAL">2 semanas</option>
                    <option value="MENSUAL">Mes</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Cantidad de citas</label>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    className="w-16 rounded bg-slate-800 border border-slate-700 text-white px-2 py-1 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="border-slate-700 text-slate-300">
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={create.isPending || createSeries.isPending || (!selectedPatientRegId && !titulo)}
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {(create.isPending || createSeries.isPending) ? "Guardando..." : repetir ? `Crear ${cantidad} citas` : "Crear cita"}
          </Button>
        </div>
      </div>
    </div>
  )
}

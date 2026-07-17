"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"
import { format, addDays, isBefore, startOfDay } from "date-fns"
import { trpc } from "@/lib/trpc-client"
import type { SessionUser } from "@/types"

export default function PortalSchedulePage() {
  const { data: session, status } = useSession()
  const isPatient = (session?.user as SessionUser | undefined)?.role === "PATIENT"
  const { data: workspaces, isLoading: loadingW } = trpc.portal.myWorkspaces.useQuery(
    undefined,
    { enabled: isPatient },
  )
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Date | undefined>()
  const [hora, setHora] = useState<string | null>(null)
  const [notas, setNotas] = useState("")
  const [done, setDone] = useState(false)

  const activeWsId = workspaceId ?? (workspaces?.[0]?.workspaceId ?? null)

  const { data: slots, isFetching: loadingSlots } = trpc.availability.getAvailableSlots.useQuery(
    { workspaceId: activeWsId!, fecha: selected ? format(selected, "yyyy-MM-dd") : "" },
    { enabled: !!activeWsId && !!selected },
  )

  const requestMut = trpc.appointment.requestFromPortal.useMutation({
    onSuccess: () => setDone(true),
  })

  const today = startOfDay(new Date())
  const maxDate = addDays(today, 60)

  if (status === "loading" || (isPatient && loadingW))
    return <p className="text-sm text-slate-400">Cargando...</p>

  if (!isPatient) {
    return (
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-white">Solicitar cita</h2>
        <p className="text-sm text-slate-400">
          Inicie sesión como paciente para solicitar una cita en línea.
        </p>
      </div>
    )
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-white">Solicitar cita</h2>
        <p className="text-sm text-slate-400">
          No tiene consultorios vinculados. Consulte con su médico para activar el portal.
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-800 bg-emerald-950 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-300">Solicitud enviada</p>
        <p className="mt-1 text-sm text-emerald-400">
          Su cita ha sido solicitada. El consultorio la confirmará pronto.
        </p>
        <button
          className="mt-4 text-sm text-blue-400 underline"
          onClick={() => {
            setDone(false)
            setSelected(undefined)
            setHora(null)
            setNotas("")
          }}
        >
          Solicitar otra cita
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-white">Solicitar cita</h2>

      {/* Workspace picker */}
      {workspaces.length > 1 && (
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Consultorio</label>
          <select
            value={activeWsId ?? ""}
            onChange={(e) => {
              setWorkspaceId(e.target.value)
              setSelected(undefined)
              setHora(null)
            }}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {workspaces.map((w: { workspaceId: string; workspaceNombre: string; doctor: { nombre: string; apellido: string; especialidadPrincipal: string } }) => (
              <option key={w.workspaceId} value={w.workspaceId}>
                {w.workspaceNombre} — Dr. {w.doctor.nombre} {w.doctor.apellido}
              </option>
            ))}
          </select>
        </div>
      )}

      {workspaces.length === 1 && (
        <div className="rounded-md border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
          <p className="text-white">
            Dr. {workspaces[0].doctor.nombre} {workspaces[0].doctor.apellido}
          </p>
          <p className="text-slate-400">{workspaces[0].doctor.especialidadPrincipal}</p>
        </div>
      )}

      {/* Date picker */}
      <div>
        <label className="mb-2 block text-xs text-slate-400">Seleccione una fecha</label>
        <div className="inline-block rounded-lg border border-slate-800 bg-slate-900 p-3">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              setSelected(d)
              setHora(null)
            }}
            locale={es}
            disabled={[{ before: addDays(today, 1) }, { after: maxDate }]}
            modifiersClassNames={{
              selected: "bg-blue-600 text-white rounded-md",
              today: "font-bold text-blue-400",
              disabled: "opacity-30",
            }}
            classNames={{
              day_button: "w-8 h-8 flex items-center justify-center text-sm text-slate-200 hover:bg-slate-800 rounded-md",
              month_caption: "text-sm text-slate-300 font-medium mb-2",
              weekday: "text-xs text-slate-500 w-8 text-center",
              weeks: "space-y-1",
            }}
          />
        </div>
      </div>

      {/* Slots */}
      {selected && (
        <div>
          <label className="mb-2 block text-xs text-slate-400">
            Turnos disponibles — {format(selected, "EEEE d 'de' MMMM", { locale: es })}
          </label>
          {loadingSlots ? (
            <p className="text-sm text-slate-400">Cargando turnos...</p>
          ) : !slots || slots.length === 0 ? (
            <p className="text-sm text-slate-400">No hay turnos disponibles para esta fecha.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s: string) => (
                <button
                  key={s}
                  onClick={() => setHora(s)}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                    hora === s
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes + submit */}
      {hora && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Motivo (opcional)</label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Indique brevemente el motivo de su consulta..."
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() =>
              requestMut.mutate({
                workspaceId: activeWsId!,
                fecha: format(selected!, "yyyy-MM-dd"),
                hora,
                notas: notas || undefined,
              })
            }
            disabled={requestMut.isPending}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {requestMut.isPending ? "Enviando..." : `Solicitar cita — ${format(selected!, "d/MM")} a las ${hora}`}
          </button>
          {requestMut.error && (
            <p className="text-sm text-red-400">{requestMut.error.message}</p>
          )}
        </div>
      )}
    </div>
  )
}

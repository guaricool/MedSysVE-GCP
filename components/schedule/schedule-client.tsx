"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"

const DIAS = [
  { label: "Domingo", value: 0 },
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
]

interface SlotState {
  diaSemana: number
  horaInicio: string
  horaFin: string
  duracionMinutos: number
  activo: boolean
}

function defaultSlots(): SlotState[] {
  return DIAS.map((d) => ({
    diaSemana: d.value,
    horaInicio: "08:00",
    horaFin: "17:00",
    duracionMinutos: 30,
    activo: d.value >= 1 && d.value <= 5, // Mon–Fri active by default
  }))
}

export function ScheduleClient() {
  const { data: existing, isLoading } = trpc.availability.getMySlots.useQuery()
  const setSlots = trpc.availability.setSlots.useMutation()
  const utils = trpc.useUtils()

  const [slots, setSlots2] = useState<SlotState[] | null>(null)
  const [saved, setSaved] = useState(false)

  const [newBlockDate, setNewBlockDate] = useState("")
  const [newBlockMotivo, setNewBlockMotivo] = useState("")

  const { data: rawExceptions, refetch: refetchExceptions } = (trpc.availability as any).listExceptions.useQuery({ desde: new Date().toISOString().slice(0, 10) })
  const exceptions = (rawExceptions ?? []) as any[]

  const addException = (trpc.availability as any).addException.useMutation({
    onSuccess: () => { refetchExceptions(); setNewBlockDate(""); setNewBlockMotivo("") }
  })
  const deleteException = (trpc.availability as any).deleteException.useMutation({
    onSuccess: () => refetchExceptions(),
    onError: (err: any) => {
      alert("Error al eliminar la excepción de horario: " + (err?.message || "Intente nuevamente."))
    }
  })

  const current: SlotState[] =
    slots ??
    (existing
      ? DIAS.map((d) => {
          const found = existing.find((e) => e.diaSemana === d.value)
          return found
            ? {
                diaSemana: found.diaSemana,
                horaInicio: found.horaInicio,
                horaFin: found.horaFin,
                duracionMinutos: found.duracionMinutos,
                activo: found.activo,
              }
            : {
                diaSemana: d.value,
                horaInicio: "08:00",
                horaFin: "17:00",
                duracionMinutos: 30,
                activo: d.value >= 1 && d.value <= 5,
              }
        })
      : defaultSlots())

  function updateSlot(idx: number, patch: Partial<SlotState>) {
    const next = current.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    setSlots2(next)
    setSaved(false)
  }

  async function handleSave() {
    await setSlots.mutateAsync(current)
    await utils.availability.getMySlots.invalidate()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (isLoading) return <p className="text-sm text-slate-400">Cargando horario...</p>

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Configure los días y horarios en que acepta citas. Los pacientes podrán solicitar turnos
        dentro de estos rangos.
      </p>

      <div className="overflow-hidden rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900">
              <th className="px-4 py-2 text-left text-xs text-slate-400">Día</th>
              <th className="px-4 py-2 text-left text-xs text-slate-400">Activo</th>
              <th className="px-4 py-2 text-left text-xs text-slate-400">Desde</th>
              <th className="px-4 py-2 text-left text-xs text-slate-400">Hasta</th>
              <th className="px-4 py-2 text-left text-xs text-slate-400">Duración (min)</th>
            </tr>
          </thead>
          <tbody>
            {current.map((slot, i) => (
              <tr
                key={slot.diaSemana}
                className={`border-b border-slate-800 last:border-0 ${slot.activo ? "bg-slate-900/40" : "opacity-50"}`}
              >
                <td className="px-4 py-3 text-slate-200">{DIAS[i].label}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={slot.activo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSlot(i, { activo: e.target.checked })}
                    className="h-4 w-4 accent-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={slot.horaInicio}
                    disabled={!slot.activo}
                    onChange={(e) => updateSlot(i, { horaInicio: e.target.value })}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={slot.horaFin}
                    disabled={!slot.activo}
                    onChange={(e) => updateSlot(i, { horaFin: e.target.value })}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={slot.duracionMinutos}
                    disabled={!slot.activo}
                    onChange={(e) => updateSlot(i, { duracionMinutos: Number(e.target.value) })}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white disabled:opacity-40"
                  >
                    {[10, 15, 20, 30, 45, 60, 90, 120].map((v) => (
                      <option key={v} value={v}>
                        {v} min
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-800 pt-4 space-y-3">
        <p className="text-sm font-medium text-slate-300">Días bloqueados</p>
        <p className="text-xs text-slate-500">Los pacientes no podrán solicitar citas en estas fechas.</p>

        <div className="flex items-end gap-2 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Fecha</label>
            <input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
            />
          </div>
          <div className="space-y-1 flex-1 min-w-40">
            <label className="text-xs text-slate-400">Motivo (opcional)</label>
            <input
              type="text"
              value={newBlockMotivo}
              onChange={(e) => setNewBlockMotivo(e.target.value)}
              placeholder="Ej: vacaciones, feriado"
              maxLength={100}
              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
            />
          </div>
          <button
            onClick={() => { if (newBlockDate) addException.mutate({ fecha: newBlockDate, motivo: newBlockMotivo || undefined }) }}
            disabled={!newBlockDate || addException.isPending}
            className="rounded-md bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600 disabled:opacity-50"
          >
            Bloquear
          </button>
        </div>

        {exceptions.length > 0 ? (
          <ul className="space-y-1">
            {exceptions.map((ex: any) => (
              <li key={ex.id} className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-sm">
                <span className="text-slate-300">
                  {new Date(ex.fecha).toLocaleDateString("es-VE", { dateStyle: "long", timeZone: 'America/Caracas' })}
                  {ex.motivo && <span className="ml-2 text-slate-500">· {ex.motivo}</span>}
                </span>
                <button 
                  onClick={() => {
                    if (window.confirm("¿Confirma eliminar esta fecha bloqueada?")) {
                      deleteException.mutate({ id: ex.id })
                    }
                  }} 
                  disabled={deleteException.isPending}
                  className="text-slate-500 hover:text-red-400 ml-2 disabled:opacity-50"
                  title="Eliminar excepción"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-600">Sin días bloqueados próximos.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={setSlots.isPending}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {setSlots.isPending ? "Guardando..." : "Guardar horario"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Guardado.</span>}
        {setSlots.error && (
          <span className="text-sm text-red-400">{setSlots.error.message}</span>
        )}
      </div>
    </div>
  )
}

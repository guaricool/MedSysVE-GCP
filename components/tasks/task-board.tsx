"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { CheckSquare, Square, Plus, Trash2, User, Calendar, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Priority = "ALTA" | "MEDIA" | "BAJA"

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string; dot: string }> = {
  ALTA: { label: "Alta", cls: "bg-red-900/40 text-red-300 border-red-800", dot: "bg-red-500" },
  MEDIA: { label: "Media", cls: "bg-amber-900/40 text-amber-300 border-amber-800", dot: "bg-amber-500" },
  BAJA: { label: "Baja", cls: "bg-slate-800 text-slate-400 border-slate-700", dot: "bg-slate-500" },
}

function isOverdue(fecha: string | null, completada: boolean) {
  if (!fecha || completada) return false
  return new Date(fecha) < new Date()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric", timeZone: 'America/Caracas' })
}

interface Props {
  staffList: { id: string; nombre: string; apellido: string; rol: string }[]
}

export function TaskBoard({ staffList }: Props) {
  const utils = trpc.useUtils()

  const { data: rawTasks, isLoading } = (trpc.task as any).list.useQuery({ completada: undefined })
  const tasks = (rawTasks as any[]) ?? []

  const createMut = (trpc.task as any).create.useMutation({
    onSuccess: () => { ;(utils.task as any).list.invalidate(); setShowCreate(false); resetForm() },
  })
  const completeMut = (trpc.task as any).complete.useMutation({
    onSuccess: () => (utils.task as any).list.invalidate(),
  })
  const deleteMut = (trpc.task as any).delete.useMutation({
    onSuccess: () => (utils.task as any).list.invalidate(),
  })

  const [showCreate, setShowCreate] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    prioridad: "MEDIA" as Priority,
    asignadoAId: "",
    fechaVencimiento: "",
  })

  function resetForm() {
    setForm({ titulo: "", descripcion: "", prioridad: "MEDIA", asignadoAId: "", fechaVencimiento: "" })
  }

  const pending = tasks.filter((t: any) => !t.completada)
  const completed = tasks.filter((t: any) => t.completada)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500">
            {pending.length} pendiente{pending.length !== 1 ? "s" : ""}
            {completed.length > 0 && ` · ${completed.length} completada${completed.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-700 hover:bg-blue-600 text-white h-8 text-xs px-3"
        >
          <Plus size={13} className="mr-1" />
          Nueva tarea
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-blue-800/40 bg-blue-950/20 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Nueva tarea</h3>
          <Input
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            placeholder="Título de la tarea *"
            className="bg-slate-800 border-slate-700 text-white"
          />
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder="Descripción (opcional)"
            rows={2}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Prioridad</label>
              <select
                value={form.prioridad}
                onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value as Priority }))}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Asignar a</label>
              <select
                value={form.asignadoAId}
                onChange={(e) => setForm((f) => ({ ...f, asignadoAId: e.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="">Sin asignar</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} {s.apellido}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Vence el</label>
              <input
                type="date"
                value={form.fechaVencimiento}
                onChange={(e) => setForm((f) => ({ ...f, fechaVencimiento: e.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowCreate(false); resetForm() }}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <Button
              size="sm"
              disabled={!form.titulo.trim() || createMut.isPending}
              onClick={() =>
                createMut.mutate({
                  titulo: form.titulo.trim(),
                  descripcion: form.descripcion || undefined,
                  prioridad: form.prioridad,
                  asignadoAId: form.asignadoAId || undefined,
                  fechaVencimiento: form.fechaVencimiento || undefined,
                })
              }
              className="bg-blue-700 hover:bg-blue-600 text-white h-8 text-xs px-4"
            >
              {createMut.isPending ? "Creando..." : "Crear tarea"}
            </Button>
          </div>
        </div>
      )}

      {/* Task list — pending */}
      {isLoading && <p className="text-sm text-slate-500">Cargando tareas...</p>}

      {!isLoading && pending.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center">
          <CheckSquare size={28} className="mx-auto mb-2 text-slate-700" />
          <p className="text-slate-500 text-sm">No hay tareas pendientes.</p>
        </div>
      )}

      <div className="space-y-2">
        {pending.map((task: any) => {
          const prio = PRIORITY_CONFIG[task.prioridad as Priority] ?? PRIORITY_CONFIG.MEDIA
          const overdue = isOverdue(task.fechaVencimiento, task.completada)

          return (
            <div
              key={task.id}
              className={`rounded-xl border p-4 transition-colors ${
                overdue ? "border-red-800/50 bg-red-950/10" : "border-slate-800 bg-slate-900/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => completeMut.mutate({ id: task.id, completada: true })}
                  disabled={completeMut.isPending}
                  className="mt-0.5 shrink-0 text-slate-500 hover:text-emerald-400 transition-colors"
                  title="Marcar como completada"
                >
                  <Square size={18} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white">{task.titulo}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1 ${prio.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                        {prio.label}
                      </span>
                      <button
                        onClick={() => deleteMut.mutate({ id: task.id })}
                        disabled={deleteMut.isPending}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {task.descripcion && (
                    <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{task.descripcion}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {task.asignadoA && (
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        {task.asignadoA.nombre} {task.asignadoA.apellido}
                      </span>
                    )}
                    {task.patientRegistration && (
                      <span className="text-slate-500">
                        Paciente: {task.patientRegistration.patient.nombre} {task.patientRegistration.patient.apellido}
                      </span>
                    )}
                    {task.fechaVencimiento && (
                      <span className={`flex items-center gap-1 ${overdue ? "text-red-400 font-medium" : ""}`}>
                        {overdue && <AlertCircle size={11} />}
                        <Calendar size={11} />
                        {formatDate(task.fechaVencimiento)}
                        {overdue && " (vencida)"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Completed tasks — collapsible */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400 mb-2"
          >
            {showCompleted ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {completed.length} tarea{completed.length !== 1 ? "s" : ""} completada{completed.length !== 1 ? "s" : ""}
          </button>
          {showCompleted && (
            <div className="space-y-1.5">
              {completed.map((task: any) => (
                <div key={task.id} className="rounded-lg border border-slate-800/50 bg-slate-900/20 px-4 py-3 flex items-center gap-3 opacity-60">
                  <button
                    onClick={() => completeMut.mutate({ id: task.id, completada: false })}
                    disabled={completeMut.isPending}
                    className="shrink-0 text-emerald-500 hover:text-slate-400 transition-colors"
                    title="Marcar como pendiente"
                  >
                    <CheckSquare size={18} />
                  </button>
                  <p className="flex-1 text-sm text-slate-500 line-through">{task.titulo}</p>
                  <button
                    onClick={() => deleteMut.mutate({ id: task.id })}
                    disabled={deleteMut.isPending}
                    className="shrink-0 text-slate-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

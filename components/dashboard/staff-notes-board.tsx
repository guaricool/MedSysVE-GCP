"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { X, Plus, StickyNote } from "lucide-react"

export function StaffNotesBoard() {
  const [text, setText] = useState("")
  const { data: notes = [], refetch } = (trpc.staffNote as any).list.useQuery()

  const add = (trpc.staffNote as any).add.useMutation({
    onSuccess: () => { setText(""); refetch() },
  })

  const remove = (trpc.staffNote as any).delete.useMutation({
    onSuccess: () => refetch(),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    add.mutate({ texto: text.trim() })
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <StickyNote size={16} className="text-yellow-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Pizarrón del equipo
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Agregar nota para el equipo..."
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || add.isPending}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
        >
          <Plus size={14} />
          Agregar
        </button>
      </form>

      {(notes as any[]).length === 0 ? (
        <p className="text-xs text-slate-600 italic">Sin notas. Agregue recordatorios para el equipo.</p>
      ) : (
        <ul className="space-y-2">
          {(notes as any[]).map((note: any) => (
            <li
              key={note.id}
              className="flex items-start gap-2 rounded-md border border-yellow-900/30 bg-yellow-950/20 px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-yellow-100 leading-snug break-words">{note.texto}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {note.autorNombre} ·{" "}
                  {new Date(note.creadoAt).toLocaleDateString("es-VE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: 'America/Caracas',
                  })}
                </p>
              </div>
              <button
                onClick={() => remove.mutate({ id: note.id })}
                disabled={remove.isPending}
                className="shrink-0 text-slate-600 hover:text-red-400 transition"
                title="Eliminar nota"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

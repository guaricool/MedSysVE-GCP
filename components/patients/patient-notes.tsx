"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"

interface Props {
  patientRegistrationId: string
  initialNotes: string | null
}

export function PatientNotes({ patientRegistrationId, initialNotes }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(initialNotes ?? "")
  const [saved, setSaved] = useState(initialNotes ?? "")

  const save = trpc.patient.updateNotes.useMutation({
    onSuccess: () => {
      setSaved(text)
      setEditing(false)
    },
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Notas internas
        </h3>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            {saved ? "Editar" : "Agregar nota"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Notas internas del consultorio sobre este paciente (no visibles al paciente)..."
            className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-600 resize-y"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate({ patientRegistrationId, notasInternas: text })}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {save.isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => { setText(saved); setEditing(false) }}
              className="rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : saved ? (
        <p className="text-sm text-slate-300 whitespace-pre-wrap">{saved}</p>
      ) : (
        <p className="text-xs text-slate-600 italic">Sin notas internas.</p>
      )}
    </div>
  )
}

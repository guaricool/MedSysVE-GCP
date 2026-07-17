"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

interface Props {
  patientId: string
  initialValue: string | null
}

export function BloodTypeEditor({ patientId, initialValue }: Props) {
  const [current, setCurrent] = useState(initialValue)
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState(initialValue ?? "")

  const update = (trpc.patient as any).updateGrupoSanguineo.useMutation({
    onSuccess: (data: { grupoSanguineo: string | null }) => {
      setCurrent(data.grupoSanguineo)
      setEditing(false)
    },
  })

  function save() {
    update.mutate({ patientId, grupoSanguineo: selected })
  }

  return (
    <div className="space-y-3">
      {!editing && (
        <div className="flex justify-end">
          <button
            className="text-xs text-blue-400 hover:underline"
            onClick={() => { setSelected(current ?? ""); setEditing(true) }}
          >
            {current ? "Editar" : "Registrar"}
          </button>
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {BLOOD_TYPES.map((bt) => (
              <button
                key={bt}
                onClick={() => setSelected(bt)}
                className={`rounded px-3 py-1 text-sm font-semibold transition ${
                  selected === bt
                    ? "bg-red-700 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {bt}
              </button>
            ))}
            <button
              onClick={() => setSelected("")}
              className={`rounded px-3 py-1 text-sm transition ${
                selected === "" ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Sin dato
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={update.isPending}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 disabled:opacity-50"
            >
              {update.isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className={`text-sm font-semibold ${current ? "text-red-300" : "text-slate-500 italic"}`}>
          {current ? `🩸 ${current}` : "No registrado"}
        </p>
      )}
    </div>
  )
}

"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { X } from "lucide-react"

const SEVERITY_COLORS = {
  LEVE: "text-yellow-400 bg-yellow-900/30",
  MODERADA: "text-orange-400 bg-orange-900/30",
  SEVERA: "text-red-400 bg-red-900/30",
}
const SEVERITY_LABELS = { LEVE: "Leve", MODERADA: "Moderada", SEVERA: "Severa" }

export function AllergiesClient({ patientRegistrationId }: { patientRegistrationId: string }) {
  const utils = trpc.useUtils()
  const { data: alergias = [] } = trpc.alergia.list.useQuery({ patientRegistrationId })
  const add = trpc.alergia.add.useMutation({ onSuccess: () => utils.alergia.list.invalidate() })
  const del = trpc.alergia.delete.useMutation({ onSuccess: () => utils.alergia.list.invalidate() })

  const [showForm, setShowForm] = useState(false)
  const [sustancia, setSustancia] = useState("")
  const [reaccion, setReaccion] = useState("")
  const [gravedad, setGravedad] = useState<"LEVE" | "MODERADA" | "SEVERA">("LEVE")

  function handleAdd() {
    if (!sustancia.trim()) return
    add.mutate({ patientRegistrationId, sustancia: sustancia.trim(), reaccion: reaccion || undefined, gravedad })
    setSustancia("")
    setReaccion("")
    setGravedad("LEVE")
    setShowForm(false)
  }

  const activas = alergias.filter((a) => a.activa)

  return (
    <div className="space-y-3">
      {!showForm && (
        <div className="flex justify-end">
          <button onClick={() => setShowForm(true)} className="text-xs text-blue-400 hover:text-blue-300">
            + Agregar
          </button>
        </div>
      )}

      {activas.length === 0 && !showForm && (
        <p className="text-xs text-slate-600">Sin alergias registradas</p>
      )}

      <div className="space-y-1">
        {activas.map((a) => (
          <div key={a.id} className="flex items-center gap-2 text-sm">
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[a.gravedad]}`}>
              {SEVERITY_LABELS[a.gravedad]}
            </span>
            <span className="text-slate-200 font-medium">{a.sustancia}</span>
            {a.reaccion && <span className="text-slate-500 text-xs">· {a.reaccion}</span>}
            <button onClick={() => del.mutate({ id: a.id })} className="ml-auto text-slate-600 hover:text-red-400">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="flex flex-wrap items-end gap-2 pt-1 border-t border-slate-800">
          <div className="space-y-0.5">
            <label className="text-xs text-slate-500">Sustancia</label>
            <input
              value={sustancia}
              onChange={(e) => setSustancia(e.target.value)}
              placeholder="Ej: Penicilina"
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white w-32"
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-xs text-slate-500">Reacción</label>
            <input
              value={reaccion}
              onChange={(e) => setReaccion(e.target.value)}
              placeholder="Ej: urticaria"
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white w-28"
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-xs text-slate-500">Gravedad</label>
            <select
              value={gravedad}
              onChange={(e) => setGravedad(e.target.value as typeof gravedad)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
            >
              <option value="LEVE">Leve</option>
              <option value="MODERADA">Moderada</option>
              <option value="SEVERA">Severa</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!sustancia.trim() || add.isPending}
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {add.isPending ? "..." : "Guardar"}
          </button>
          <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-300">
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

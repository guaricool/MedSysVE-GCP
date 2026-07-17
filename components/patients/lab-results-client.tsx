"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"

interface Props {
  patientRegistrationId: string
  role: string
  /**
   * Whether to expose the "+ Agregar resultado" form. The patient history
   * page (outside an active consultation) sets this to `false` so the doctor
   * only sees existing results; the in-consultation `ManualLabResultsForm`
   * is the canonical place to record a new result.
   */
  allowAdd?: boolean
}

export function LabResultsClient({ patientRegistrationId, role, allowAdd = true }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [resultado, setResultado] = useState("")

  const { data: results = [], refetch } = trpc.labResult.list.useQuery({ patientRegistrationId })
  const save = trpc.labResult.save.useMutation({
    onSuccess: () => {
      refetch()
      setShowForm(false)
      setTitulo("")
      setResultado("")
    },
  })
  const del = trpc.labResult.delete.useMutation({ onSuccess: () => refetch() })

  const isDoctor = role === "DOCTOR"
  const canAdd = isDoctor && allowAdd

  return (
    <div className="space-y-3">
      {canAdd && !showForm && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            + Agregar resultado
          </button>
        </div>
      )}

      {!allowAdd && (
        <p className="text-[11px] text-slate-500">
          Para registrar un nuevo resultado, abra una consulta y use la sección
          <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">Resultados de Laboratorio</span>
          dentro del encuentro.
        </p>
      )}

      {showForm && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Título / tipo de examen</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Hemograma completo"
                className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-white placeholder-slate-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Fecha del examen</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Resultado (texto libre o pegue del OCR)</label>
            <textarea
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              rows={5}
              placeholder="Pegue aquí el texto del resultado de laboratorio..."
              className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-white placeholder-slate-500 resize-y"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={save.isPending || !titulo || !resultado}
              onClick={() => save.mutate({ patientRegistrationId, titulo, fecha, resultado })}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {save.isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {results.length === 0 && !showForm ? (
        <p className="text-xs text-slate-500">Sin resultados de laboratorio registrados.</p>
      ) : (
        <ul className="space-y-2">
          {results.map((r: any) => (
            <li key={r.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{r.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.fecha).toLocaleDateString("es-VE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: 'America/Caracas',
                    })}
                  </p>
                </div>
                {canAdd && (
                  <button
                    type="button"
                    disabled={del.isPending}
                    onClick={() => del.mutate({ id: r.id })}
                    className="text-xs text-slate-600 hover:text-red-400 shrink-0"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              {r.valores && Array.isArray(r.valores) && r.valores.length > 0 ? (
                <div className="mt-3 overflow-x-auto rounded border border-slate-700 bg-slate-950/50">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead className="border-b border-slate-700 bg-slate-900/50">
                      <tr>
                        <th className="px-2 py-1.5 font-medium">Parámetro</th>
                        <th className="px-2 py-1.5 font-medium">Valor</th>
                        <th className="px-2 py-1.5 font-medium">Unidad</th>
                        <th className="px-2 py-1.5 font-medium">Referencia</th>
                        <th className="px-2 py-1.5 font-medium">Interpretación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {r.valores.map((v: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="px-2 py-1.5">{v.parametro}</td>
                          <td className="px-2 py-1.5 font-medium">{v.valor}</td>
                          <td className="px-2 py-1.5 text-slate-400">{v.unidad}</td>
                          <td className="px-2 py-1.5 text-slate-400">{v.rangoReferencia}</td>
                          <td className="px-2 py-1.5">
                            {v.interpretado ? (
                              <span className={`rounded px-1.5 py-0.5 font-medium ${
                                v.interpretado === "NORMAL" ? "bg-emerald-900/40 text-emerald-300" :
                                v.interpretado === "BAJO" ? "bg-blue-900/40 text-blue-300" :
                                v.interpretado === "ALTO" ? "bg-amber-900/40 text-amber-300" :
                                v.interpretado === "CRITICO" ? "bg-red-900/40 text-red-300" :
                                "bg-slate-800 text-slate-400"
                              }`}>
                                {v.interpretado}
                              </span>
                            ) : <span className="text-slate-600">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : r.resultado ? (
                <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-300 font-mono bg-slate-950/50 rounded p-2 overflow-x-auto">
                  {r.resultado}
                </pre>
              ) : null}
              {r.notas && (
                <div className="mt-2 text-xs text-slate-400 italic">
                  <span className="font-medium text-slate-500 not-italic">Notas: </span>
                  {r.notas}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

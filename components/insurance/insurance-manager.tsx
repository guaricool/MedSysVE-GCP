"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Shield, Plus, Pencil, Check, X } from "lucide-react"

interface Insurance {
  id: string
  activa: boolean
  numeroPóliza: string
  titular: string | null
  coberturaPct: number
  fechaVigencia: Date | string | null
  notas: string | null
  provider: { id: string; nombre: string; codigo: string | null }
}

interface Props {
  patientRegistrationId: string
}

export function InsuranceManager({ patientRegistrationId }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const utils = trpc.useUtils()

  const { data: insurances = [], isLoading } = (trpc.insurance as any).listPatientInsurances.useQuery({
    patientRegistrationId,
  })
  const { data: providers = [] } = (trpc.insurance as any).listProviders.useQuery()

  const addMutation = (trpc.insurance as any).addPatientInsurance.useMutation({
    onSuccess: () => {
      utils.invalidate()
      setShowForm(false)
    },
    onError: (e: any) => alert(e.message),
  })

  const updateMutation = (trpc.insurance as any).updatePatientInsurance.useMutation({
    onSuccess: () => {
      utils.invalidate()
      setEditId(null)
    },
    onError: (e: any) => alert(e.message),
  })

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    addMutation.mutate({
      patientRegistrationId,
      providerId: fd.get("providerId") as string,
      numeroPóliza: fd.get("numeroPóliza") as string,
      titular: (fd.get("titular") as string) || undefined,
      coberturaPct: Number(fd.get("coberturaPct") ?? 100),
      fechaVigencia: (fd.get("fechaVigencia") as string) || undefined,
      notas: (fd.get("notas") as string) || undefined,
    })
  }

  function handleToggleActiva(ins: Insurance) {
    updateMutation.mutate({ id: ins.id, activa: !ins.activa })
  }

  if (isLoading) return <p className="text-xs text-slate-500">Cargando seguros...</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
          <Shield className="h-4 w-4 text-blue-400" />
          Seguros / HMO
        </h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-400 hover:text-white hover:border-slate-500"
        >
          <Plus className="h-3 w-3" />
          Agregar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-2 rounded-md border border-slate-700 bg-slate-800/50 p-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-slate-400">Aseguradora *</label>
              <select
                name="providerId"
                required
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
              >
                <option value="">Seleccionar...</option>
                {providers.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400">N° Póliza *</label>
              <input
                name="numeroPóliza"
                required
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400">Cobertura %</label>
              <input
                name="coberturaPct"
                type="number"
                min="0"
                max="100"
                defaultValue="100"
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400">Titular</label>
              <input
                name="titular"
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400">Vigencia hasta</label>
              <input
                name="fechaVigencia"
                type="date"
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-400">Notas</label>
              <input
                name="notas"
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="rounded bg-blue-700 px-3 py-1 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {addMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {insurances.length === 0 && !showForm && (
        <p className="text-xs text-slate-500">Sin seguros registrados.</p>
      )}

      <ul className="space-y-2">
        {insurances.map((ins: Insurance) => {
          const expired =
            ins.fechaVigencia && new Date(ins.fechaVigencia) < new Date()
          return (
            <li
              key={ins.id}
              className={`rounded-md border px-3 py-2 text-xs ${
                ins.activa && !expired
                  ? "border-blue-800 bg-blue-950/20"
                  : "border-slate-800 bg-slate-900/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-200">
                    {ins.provider.nombre}
                    {ins.provider.codigo && (
                      <span className="ml-1 text-slate-500">({ins.provider.codigo})</span>
                    )}
                  </p>
                  <p className="text-slate-400">
                    Póliza: {ins.numeroPóliza}
                    {ins.titular && ` · Titular: ${ins.titular}`}
                  </p>
                  <p className="text-slate-400">
                    Cobertura: {ins.coberturaPct}%
                    {ins.fechaVigencia && (
                      <span className={expired ? "ml-2 text-red-400" : "ml-2 text-slate-500"}>
                        · Hasta: {new Date(ins.fechaVigencia).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}
                        {expired && " (vencido)"}
                      </span>
                    )}
                  </p>
                  {ins.notas && <p className="mt-0.5 text-slate-500">{ins.notas}</p>}
                </div>
                <button
                  onClick={() => handleToggleActiva(ins)}
                  title={ins.activa ? "Desactivar" : "Activar"}
                  className="rounded p-1 text-slate-500 hover:text-white"
                >
                  {ins.activa ? <Check className="h-3.5 w-3.5 text-green-400" /> : <X className="h-3.5 w-3.5" />}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Plus, Pencil, Check, X, Building2 } from "lucide-react"

interface Provider {
  id: string
  nombre: string
  codigo: string | null
  telefono: string | null
  email: string | null
  activo: boolean
  createdAt: string
}

export function InsurancePageClient() {
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Provider>>({})
  const utils = trpc.useUtils()

  const { data: providers = [], isLoading } = (trpc.insurance as any).listProviders.useQuery()

  const createMutation = (trpc.insurance as any).createProvider.useMutation({
    onSuccess: () => {
      utils.invalidate()
      setShowCreate(false)
    },
    onError: (e: any) => alert(e.message),
  })

  const updateMutation = (trpc.insurance as any).updateProvider.useMutation({
    onSuccess: () => {
      utils.invalidate()
      setEditId(null)
    },
    onError: (e: any) => alert(e.message),
  })

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    createMutation.mutate({
      nombre: fd.get("nombre") as string,
      codigo: (fd.get("codigo") as string) || undefined,
      telefono: (fd.get("telefono") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
    })
  }

  function handleUpdate(id: string) {
    updateMutation.mutate({ id, ...editData })
  }

  function startEdit(p: Provider) {
    setEditId(p.id)
    setEditData({ nombre: p.nombre, codigo: p.codigo ?? "", telefono: p.telefono ?? "", email: p.email ?? "" })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 rounded bg-blue-700 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          Nueva Aseguradora
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-slate-700 bg-slate-800 p-4 space-y-3 text-sm"
        >
          <h2 className="font-semibold text-white">Nueva aseguradora / HMO</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-400">Nombre *</label>
              <input
                name="nombre"
                required
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Código / Siglas</label>
              <input
                name="codigo"
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Teléfono</label>
              <input
                name="telefono"
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400">Email</label>
              <input
                name="email"
                type="email"
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded bg-blue-700 px-4 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="text-sm text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}

      {!isLoading && providers.length === 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm text-slate-400">No hay aseguradoras registradas.</p>
        </div>
      )}

      <div className="space-y-2">
        {providers.map((p: Provider) => {
          const isEditing = editId === p.id
          return (
            <div
              key={p.id}
              className={`rounded-lg border p-4 text-sm ${
                p.activo ? "border-slate-700 bg-slate-900" : "border-slate-800 bg-slate-900 opacity-50"
              }`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400">Nombre</label>
                      <input
                        value={editData.nombre ?? ""}
                        onChange={(e) => setEditData((d) => ({ ...d, nombre: e.target.value }))}
                        className="mt-0.5 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Código</label>
                      <input
                        value={editData.codigo ?? ""}
                        onChange={(e) => setEditData((d) => ({ ...d, codigo: e.target.value }))}
                        className="mt-0.5 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Teléfono</label>
                      <input
                        value={editData.telefono ?? ""}
                        onChange={(e) => setEditData((d) => ({ ...d, telefono: e.target.value }))}
                        className="mt-0.5 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400">Email</label>
                      <input
                        value={editData.email ?? ""}
                        onChange={(e) => setEditData((d) => ({ ...d, email: e.target.value }))}
                        className="mt-0.5 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(p.id)}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1 rounded bg-blue-700 px-3 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Guardar
                    </button>
                    <button onClick={() => setEditId(null)} className="text-xs text-slate-400 hover:text-white">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {p.nombre}
                      {p.codigo && <span className="ml-2 text-xs text-slate-400">({p.codigo})</span>}
                      {!p.activo && <span className="ml-2 text-xs text-red-400">Inactiva</span>}
                    </p>
                    <div className="mt-0.5 flex gap-4 text-xs text-slate-400">
                      {p.telefono && <span>Tel: {p.telefono}</span>}
                      {p.email && <span>{p.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded p-1.5 text-slate-500 hover:text-white hover:bg-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => updateMutation.mutate({ id: p.id, activo: !p.activo })}
                      title={p.activo ? "Desactivar" : "Activar"}
                      className="rounded p-1.5 text-slate-500 hover:text-white hover:bg-slate-800"
                    >
                      {p.activo ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 text-green-400" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

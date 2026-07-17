"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import Link from "next/link"
import { Search } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function PatientListClient() {
  const [query, setQuery] = useState("")
  const [sexo, setSexo] = useState<"" | "MASCULINO" | "FEMENINO" | "OTRO">("")
  const [tagInput, setTagInput] = useState("")
  const [tag, setTag] = useState("")

  const { data: session } = useSession()
  const currentWorkspaceId = session?.user?.workspaceId as string | undefined
  const router = useRouter()
  const importPatient = trpc.patient.importPatient.useMutation()

  const hasSearch = query.length >= 2
  const hasFilter = !!(sexo || tag)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchQuery = trpc.patient.search.useQuery({ query }, { enabled: hasSearch })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listQuery = trpc.patient.list.useQuery(
    { sexo: sexo || undefined, tag: tag || undefined },
    { enabled: !hasSearch && hasFilter }
  )

  const isLoading = hasSearch ? searchQuery.isLoading : listQuery.isLoading
  const regs = (hasSearch
    ? (searchQuery.data as any[]) ?? []
    : hasFilter
      ? (listQuery.data as any[]) ?? []
      : []) as any[]

  // Deduplicate physical patients (if they exist in multiple workspaces)
  // Prefer the one in current workspace
  const uniqueRegs = Array.from(
    regs.reduce((acc, r) => {
      const key = r.patient.numeroIdentificacion || r.patient.nombre + r.patient.apellido
      if (!acc.has(key) || r.workspaceId === currentWorkspaceId) {
        acc.set(key, r)
      }
      return acc
    }, new Map<string, any>())
  .values())

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, cédula o ID..."
          className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white pl-9 pr-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sexo}
          onChange={(e) => setSexo(e.target.value as "" | "MASCULINO" | "FEMENINO" | "OTRO")}
          className="rounded-md bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos los sexos</option>
          <option value="MASCULINO">Masculino</option>
          <option value="FEMENINO">Femenino</option>
          <option value="OTRO">Otro</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filtrar por etiqueta..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setTag(tagInput.trim()) }}
            className="rounded-md bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 text-sm w-44"
          />
          <button
            type="button"
            onClick={() => setTag(tagInput.trim())}
            className="rounded-md bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-600"
          >
            Filtrar
          </button>
        </div>

        {(hasFilter || hasSearch) && (
          <button
            type="button"
            onClick={() => { setSexo(""); setTag(""); setTagInput(""); setQuery("") }}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Limpiar
          </button>
        )}

        {(hasSearch || hasFilter) && (
          <span className="ml-auto text-xs text-slate-500">
            {isLoading ? "Buscando..." : `${uniqueRegs.length} resultado${uniqueRegs.length !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      {/* Results */}
      <div className="space-y-2">
        {!hasSearch && !hasFilter ? (
          <div className="py-12 text-center">
            <Search size={32} className="mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500 text-sm">Busque un paciente por nombre, cédula o ID</p>
            <p className="text-slate-600 text-xs mt-1">También puede filtrar por sexo o etiqueta</p>
          </div>
        ) : isLoading ? (
          <p className="text-slate-400 text-sm py-4 text-center">Buscando...</p>
        ) : uniqueRegs.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">Sin resultados.</p>
        ) : (
          uniqueRegs.map((r: any) => (
            <button
              key={r.id}
              onClick={() => {
                if (r.workspaceId !== currentWorkspaceId) {
                  importPatient.mutate({ patientId: r.patientId }, {
                    onSuccess: (newReg) => router.push(`/doctor/patients/${newReg.id}`)
                  })
                } else {
                  router.push(`/doctor/patients/${r.id}`)
                }
              }}
              disabled={importPatient.isPending && importPatient.variables?.patientId === r.patientId}
              className="w-full text-left bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex items-center justify-between hover:border-slate-700 hover:bg-slate-800/70 transition-colors disabled:opacity-50"
            >
              <div>
                <span className="text-blue-400 font-mono text-sm mr-3">#{r.idDisplay}</span>
                <span className="text-white font-medium">
                  {r.patient.nombre} {r.patient.apellido}
                </span>
                {r.patient.sinCedula && (
                  <span className="ml-2 text-xs text-amber-400">Menor de edad</span>
                )}
              </div>
              <span className="text-slate-400 text-sm">
                {r.patient.numeroIdentificacion
                  ? `${r.patient.tipoIdentificacion?.replace("CEDULA_", "")} ${r.patient.numeroIdentificacion}`
                  : "Sin cédula"}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

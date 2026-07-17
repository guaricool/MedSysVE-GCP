"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function PatientSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const { data: rawResults, isLoading } = trpc.patient.search.useQuery(
    { query },
    { enabled: query.length >= 2 }
  )
  const results = (rawResults ?? []) as any[]

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, cédula o ID..."
          className="bg-slate-800 border-slate-700 text-white pl-9"
        />
      </div>
      {query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg z-10 shadow-xl">
          {isLoading ? (
            <p className="text-slate-400 text-sm p-3">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="text-slate-400 text-sm p-3">Sin resultados</p>
          ) : (
            results.map((r) => (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setQuery("")
                  router.push(`/doctor/patients/${r.id}`)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setQuery("")
                    router.push(`/doctor/patients/${r.id}`)
                  }
                }}
                className="px-4 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0"
              >
                <span className="text-blue-400 font-mono text-xs mr-2">
                  #{r.idDisplay}
                </span>
                <span className="text-white text-sm">
                  {r.patient.nombre} {r.patient.apellido}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

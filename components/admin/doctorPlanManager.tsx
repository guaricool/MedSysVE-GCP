"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"

type Doctor = {
  id: string
  nombre: string
  apellido: string
  email: string
  especialidad: string
  plan: string
  isAdmin: boolean
  createdAt: Date
  workspaces: number
  pacientes: number
  encuentros: number
}

const PLANS = ["free", "trial", "premium", "cortesia"] as const

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    premium: "bg-amber-400/15 text-amber-400 border-amber-400/30",
    trial: "bg-blue-400/15 text-blue-400 border-blue-400/30",
    cortesia: "bg-purple-400/15 text-purple-400 border-purple-400/30",
    free: "bg-slate-400/15 text-slate-400 border-slate-400/30",
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border capitalize ${map[plan] ?? map.free}`}>
      {plan}
    </span>
  )
}

function PlanSelector({ doctorId, currentPlan }: { doctorId: string; currentPlan: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const setPlan = trpc.admin.setPlan.useMutation({
    onSuccess: () => startTransition(() => router.refresh()),
  })

  return (
    <div className="flex items-center gap-2">
      <PlanBadge plan={currentPlan} />
      <select
        defaultValue=""
        disabled={pending || setPlan.isPending}
        onChange={(e) => {
          if (e.target.value) {
            setPlan.mutate({ doctorId, plan: e.target.value as "free" | "trial" | "premium" | "cortesia" })
            e.target.value = ""
          }
        }}
        className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1 disabled:opacity-50"
      >
        <option value="" disabled>Cambiar…</option>
        {PLANS.filter((p) => p !== currentPlan).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      {(pending || setPlan.isPending) && (
        <span className="text-xs text-slate-500">Guardando…</span>
      )}
    </div>
  )
}

export function DoctorPlanManager({ doctors }: { doctors: Doctor[] }) {
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("all")

  const filtered = doctors.filter((d) => {
    const matchSearch =
      !search ||
      `${d.nombre} ${d.apellido} ${d.email}`.toLowerCase().includes(search.toLowerCase())
    const matchPlan = planFilter === "all" || d.plan === planFilter
    return matchSearch && matchPlan
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar doctor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Todos los planes</option>
          <option value="free">Free</option>
          <option value="trial">Trial</option>
          <option value="premium">Premium</option>
          <option value="cortesia">Cortesía</option>
        </select>
        <span className="text-slate-500 text-sm flex items-center">{filtered.length} resultado(s)</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Doctor</th>
              <th className="text-left px-4 py-3">Especialidad</th>
              <th className="text-left px-4 py-3">Pacientes</th>
              <th className="text-left px-4 py-3">Consultas</th>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-left px-4 py-3">Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-slate-500 py-8">No hay resultados</td>
              </tr>
            )}
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{d.nombre} {d.apellido}</p>
                  <p className="text-slate-500 text-xs">{d.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-300 text-xs">{d.especialidad}</td>
                <td className="px-4 py-3 text-slate-300">{d.pacientes}</td>
                <td className="px-4 py-3 text-slate-300">{d.encuentros}</td>
                <td className="px-4 py-3">
                  <PlanSelector doctorId={d.id} currentPlan={d.plan} />
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(d.createdAt).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

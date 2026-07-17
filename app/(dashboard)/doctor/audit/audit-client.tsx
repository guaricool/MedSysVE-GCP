"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { ShieldCheck, ChevronDown } from "lucide-react"

interface AuditLog {
  id: string
  accion: string
  entidad: string
  entidadId: string | null
  actorNombre: string | null
  detalle: Record<string, unknown> | null
  createdAt: string | Date
}

const ACCION_COLOR: Record<string, string> = {
  CONSULTA_FIRMADA: "text-emerald-400",
  PRESCRIPCION_CREADA: "text-blue-400",
  DOCUMENTO_GENERADO: "text-purple-400",
  FACTURA_CREADA: "text-amber-400",
  PACIENTE_CREADO: "text-cyan-400",
}

const ENTIDAD_OPTIONS = [
  "", "Encounter", "Prescription", "Document", "Invoice", "PatientRegistration",
]

export function AuditClient() {
  const [entidad, setEntidad] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [skip, setSkip] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const TAKE = 50

  const { data: logs = [], isLoading } = (trpc.audit as any).list.useQuery({
    entidad: entidad || undefined,
    from: from || undefined,
    to: to ? `${to}T23:59:59` : undefined,
    take: TAKE,
    skip,
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 text-sm">
        <select
          value={entidad}
          onChange={(e) => { setEntidad(e.target.value); setSkip(0) }}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-300 text-sm"
        >
          <option value="">Todas las entidades</option>
          {ENTIDAD_OPTIONS.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setSkip(0) }}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-300 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setSkip(0) }}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-300 text-sm"
        />
        <button
          onClick={() => { setEntidad(""); setFrom(""); setTo(""); setSkip(0) }}
          className="text-xs text-slate-500 hover:text-white"
        >
          Limpiar
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}

      {!isLoading && logs.length === 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm text-slate-400">No hay registros de auditoría.</p>
        </div>
      )}

      <div className="space-y-1">
        {(logs as AuditLog[]).map((log) => (
          <div
            key={log.id}
            className="rounded-md border border-slate-800 bg-slate-900 overflow-hidden"
          >
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-800/50"
              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
            >
              <span className={`font-mono text-xs font-bold ${ACCION_COLOR[log.accion] ?? "text-slate-400"}`}>
                {log.accion}
              </span>
              <span className="text-slate-500 text-xs">·</span>
              <span className="text-slate-400 text-xs">{log.entidad}</span>
              {log.entidadId && (
                <span className="text-slate-600 text-xs font-mono truncate max-w-[80px]">
                  {log.entidadId.slice(-8)}
                </span>
              )}
              <span className="ml-auto text-slate-500 text-xs shrink-0">
                {log.actorNombre ?? "Sistema"}
              </span>
              <span className="text-slate-600 text-xs shrink-0">
                {new Date(log.createdAt).toLocaleString("es-VE", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: 'America/Caracas',
                })}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-600 shrink-0 transition-transform ${
                  expandedId === log.id ? "rotate-180" : ""
                }`}
              />
            </button>
            {expandedId === log.id && log.detalle && (
              <div className="border-t border-slate-800 px-4 py-2 bg-slate-950/50">
                <pre className="text-xs text-slate-400 overflow-x-auto">
                  {JSON.stringify(log.detalle, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {(logs as AuditLog[]).length === TAKE && (
        <div className="flex gap-3">
          {skip > 0 && (
            <button
              onClick={() => setSkip(Math.max(0, skip - TAKE))}
              className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-400 hover:text-white"
            >
              ← Anterior
            </button>
          )}
          <button
            onClick={() => setSkip(skip + TAKE)}
            className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-400 hover:text-white"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}

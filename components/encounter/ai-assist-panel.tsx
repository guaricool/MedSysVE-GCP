"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"

interface Props {
  encounterId: string
}

export function AiAssistPanel({ encounterId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [diferencial, setDiferencial] = useState<string[]>([])
  const [plan, setPlan] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [lastMode, setLastMode] = useState<"dx" | "plan" | null>(null)

  const { data: rawEnc } = trpc.encounter.get.useQuery({ id: encounterId })
  const enc = rawEnc as any

  async function callAI(mode: "dx" | "plan") {
    setLoading(true)
    setError(null)
    setLastMode(mode)
    try {
      const res = await fetch("/api/ai/encounter-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Server uses encounterId to load active allergies server-side
          // (single source of truth — never trust client-supplied PHI lists).
          encounterId,
          motivo: enc?.motivo,
          historiaClinica: enc?.historiaClinica,
          vitales: enc?.vitales,
          diagnoses: enc?.diagnoses?.map((d: any) => ({ codigo: d.codigoCie10, descripcion: d.descripcion })),
        }),
      })
      const data = await res.json()
      setDiferencial(data.diferencial ?? [])
      setPlan(data.plan ?? "")
    } catch {
      setError("Error al conectar con el asistente IA.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300"
      >
        <span>✦ IA Asistente Clínico</span>
        <span className="text-slate-500 text-xs">{open ? "▲ cerrar" : "▼ abrir"}</span>
      </button>

      {open && (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 space-y-4">
          <p className="text-xs text-amber-700/80 italic">
            Solo orientativo — prevalece el criterio clínico del médico.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={loading}
              onClick={() => callAI("dx")}
              className="bg-amber-800/60 hover:bg-amber-700/60 text-amber-100 border border-amber-700/50"
            >
              {loading && lastMode === "dx" ? "Consultando IA..." : "Sugerir diagnósticos diferenciales"}
            </Button>
            <Button
              size="sm"
              disabled={loading}
              onClick={() => callAI("plan")}
              className="bg-amber-800/60 hover:bg-amber-700/60 text-amber-100 border border-amber-700/50"
            >
              {loading && lastMode === "plan" ? "Redactando..." : "Redactar sugerencia de plan"}
            </Button>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {lastMode === "dx" && diferencial.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Diagnósticos diferenciales sugeridos</p>
              <ol className="list-none space-y-1">
                {diferencial.map((dx, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-amber-600 text-xs font-mono mt-0.5">{i + 1}.</span>
                    <span>{dx}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {lastMode === "plan" && plan && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Sugerencia de plan terapéutico</p>
              <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed font-sans">{plan}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

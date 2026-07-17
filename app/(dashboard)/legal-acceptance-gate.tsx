"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Markdown } from "@/lib/legal/markdown"

interface LegalDoc {
  slug: string
  version: string
  title: string
  effectiveAt: Date
  required: boolean
  legalVersionId: string | null
  content: string
}

export function LegalAcceptanceGate({
  doctorId,
  workspaceId,
  docs,
}: {
  doctorId: string
  workspaceId: string
  docs: LegalDoc[]
}) {
  const router = useRouter()
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const accept = trpc.doctor.acceptLegal.useMutation({
    onSuccess: () => {
      router.refresh()
    },
    onError: (e) => setError(e.message),
  })

  const requiredDocs = docs.filter((d) => d.required)
  const allRequiredAccepted = requiredDocs.every((d) => accepted[d.slug])
  const optionalDocs = docs.filter((d) => !d.required)

  function handleAccept() {
    if (!allRequiredAccepted) {
      setError("Debes aceptar todos los documentos obligatorios para usar el sistema.")
      return
    }
    setError(null)
    accept.mutate({
      acceptances: Object.entries(accepted)
        .filter(([_, v]) => v)
        .map(([slug, _]) => ({ slug })),
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-2">
            LOPDP Art. 25 — Consentimiento expreso requerido
          </p>
          <h1 className="text-3xl font-bold text-white mb-2">
            Antes de continuar, necesitamos tu consentimiento
          </h1>
          <p className="text-slate-300 leading-relaxed">
            El sistema de gestión clínica MedSysVE (operado por Yoguitech.LLC)
            ha publicado una nueva versión de los documentos legales. Por la Ley
            Orgánica de Protección de Datos Personales de Venezuela, necesitamos
            que aceptes explícitamente los términos antes de poder usar el sistema.
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Lee cada documento, marca la casilla de aceptación, y al final
            presiona <strong className="text-amber-300">"Aceptar y continuar"</strong>.
            Tu aceptación queda registrada con timestamp, IP truncada y user-agent
            para fines de auditoría (LOPDP Art. 32).
          </p>
        </header>

        <div className="space-y-6">
          {docs.map((doc) => (
            <DocCard
              key={doc.slug}
              doc={doc}
              accepted={!!accepted[doc.slug]}
              onToggle={(v) => setAccepted((prev) => ({ ...prev, [doc.slug]: v }))}
            />
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
          <div className="text-xs text-slate-500">
            Aceptación registrada con fines de cumplimiento LOPDP.
            Tu ID de doctor: <span className="font-mono">{doctorId.slice(0, 8)}…</span>
          </div>
          <Button
            onClick={handleAccept}
            disabled={!allRequiredAccepted || accept.isPending}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-6"
          >
            {accept.isPending ? "Registrando…" : "Aceptar y continuar →"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function DocCard({
  doc,
  accepted,
  onToggle,
}: {
  doc: LegalDoc
  accepted: boolean
  onToggle: (v: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <section
      className={`rounded-xl border ${
        accepted
          ? "border-emerald-500/40 bg-emerald-500/5"
          : doc.required
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-slate-800 bg-slate-900/40"
      } p-5 transition-colors`}
    >
      <div className="flex items-start gap-4">
        <input
          id={`accept-${doc.slug}`}
          type="checkbox"
          checked={accepted}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950"
        />
        <div className="flex-1">
          <label htmlFor={`accept-${doc.slug}`} className="cursor-pointer">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-white">{doc.title}</h2>
              <span className="text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                v{doc.version}
              </span>
              {doc.required ? (
                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Obligatorio
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600">
                  Opcional
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Versión {doc.version} · Vigente desde{" "}
              {doc.effectiveAt.toLocaleDateString("es-VE", { timeZone: "America/Caracas" })}
            </p>
          </label>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline"
          >
            {open ? "Ocultar contenido" : "Leer documento completo"}
          </button>
          {open && (
            <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <Markdown source={doc.content} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { FileCheck, Plus, CheckCircle, Clock } from "lucide-react"

interface Consent {
  id: string
  firmado: boolean
  firmadoAt: Date | string | null
  notas: string | null
  createdAt: Date | string
  template: { id: string; titulo: string }
}

interface Template {
  id: string
  titulo: string
  contenido: string
  activo: boolean
}

interface Props {
  patientRegistrationId: string
  encounterId?: string
}

export function ConsentManager({ patientRegistrationId, encounterId }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const utils = trpc.useUtils()

  const { data: consents = [] } = (trpc.consent as any).listPatientConsents.useQuery({
    patientRegistrationId,
  })
  const { data: templates = [] } = (trpc.consent as any).listTemplates.useQuery()

  const createMutation = (trpc.consent as any).createConsent.useMutation({
    onSuccess: () => {
      utils.invalidate()
      setShowAdd(false)
      setSelectedTemplateId("")
    },
    onError: (e: any) => alert(e.message),
  })

  const signMutation = (trpc.consent as any).signConsent.useMutation({
    onSuccess: () => utils.invalidate(),
    onError: (e: any) => alert(e.message),
  })

  const activeTemplates = (templates as Template[]).filter((t) => t.activo)
  const pendingConsents = (consents as Consent[]).filter((c) => !c.firmado)
  const signedConsents = (consents as Consent[]).filter((c) => c.firmado)

  function handleCreate() {
    if (!selectedTemplateId) return
    createMutation.mutate({
      patientRegistrationId,
      templateId: selectedTemplateId,
      encounterId,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
          <FileCheck className="h-4 w-4 text-purple-400" />
          Consentimientos Informados
          {pendingConsents.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {pendingConsents.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1 rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-400 hover:text-white hover:border-slate-500"
        >
          <Plus className="h-3 w-3" />
          Solicitar
        </button>
      </div>

      {showAdd && (
        <div className="rounded-md border border-slate-700 bg-slate-800/50 p-3 space-y-2 text-xs">
          <label className="text-slate-400">Plantilla de consentimiento</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white text-sm"
          >
            <option value="">Seleccionar plantilla...</option>
            {activeTemplates.map((t) => (
              <option key={t.id} value={t.id}>{t.titulo}</option>
            ))}
          </select>
          {activeTemplates.length === 0 && (
            <p className="text-amber-400">No hay plantillas activas. Crea una en Configuración → Consentimientos.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!selectedTemplateId || createMutation.isPending}
              className="rounded bg-purple-700 px-3 py-1 text-white hover:bg-purple-600 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creando..." : "Crear"}
            </button>
            <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {consents.length === 0 && !showAdd && (
        <p className="text-xs text-slate-500">Sin consentimientos registrados.</p>
      )}

      {pendingConsents.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-amber-400 font-semibold">Pendientes de firma</p>
          {pendingConsents.map((c: Consent) => (
            <div
              key={c.id}
              className="rounded-md border border-amber-800/50 bg-amber-950/20 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-slate-200 font-medium">{c.template.titulo}</span>
                </div>
                <button
                  onClick={() => signMutation.mutate({ id: c.id })}
                  disabled={signMutation.isPending}
                  className="rounded border border-green-700 px-2 py-0.5 text-xs text-green-400 hover:bg-green-900/30 disabled:opacity-50"
                >
                  Firmar
                </button>
              </div>
              <p className="text-slate-500 mt-0.5">
                Creado: {new Date(c.createdAt).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}
              </p>
              {c.notas && <p className="text-slate-500">{c.notas}</p>}
            </div>
          ))}
        </div>
      )}

      {signedConsents.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-emerald-400 font-semibold">Firmados</p>
          {signedConsents.map((c: Consent) => (
            <div
              key={c.id}
              className="rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-slate-300 font-medium">{c.template.titulo}</span>
                {c.firmadoAt && (
                  <span className="text-slate-500 ml-auto">
                    {new Date(c.firmadoAt).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState, useMemo } from "react"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { FileText, Sparkles, BookOpen, X, Settings, Loader2, Check } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"
import {
  DEFAULT_REPORT_SECCIONES,
  REPORT_SECTION_DESCRIPTIONS,
  REPORT_SECTION_KEYS,
  REPORT_SECTION_LABELS,
  type ReportInstruccionesMap,
  type ReportOverride,
  type ReportSeccionesMap,
  type ReportSectionKey,
} from "@/types/report"

interface Props {
  encounterId: string
  patientRegId: string
  disabled?: boolean
}

export function InformeForm({ encounterId, patientRegId, disabled }: Props) {
  const [contenido, setContenido] = useState("")
  const [docId, setDocId] = useState<string | null>(null)
  const [showDocTemplates, setShowDocTemplates] = useState(false)
  const [saveTmplName, setSaveTmplName] = useState("")
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return contenido.trim() !== ""
  }, [contenido])

  useEffect(() => {
    setDirty("informe", isDirty)
  }, [isDirty, setDirty])

  const { data: rawDocTemplates, refetch: refetchDocTemplates } = (trpc.template as any).listDoc.useQuery({ tipo: "INFORME" })
  const docTemplates = (rawDocTemplates ?? []) as any[]

  const saveDocTmpl = (trpc.template as any).saveDoc.useMutation({
    onSuccess: () => { refetchDocTemplates(); setSaveTmplName(""); setShowSaveForm(false) }
  })
  const deleteDocTmpl = (trpc.template as any).deleteDoc.useMutation({
    onSuccess: () => refetchDocTemplates()
  })

  // tsc TS2589 workaround (audit S9, S10): see plan-form.tsx for context.
  // next build's incremental tsc trips TS2589 here even though plain
  // `tsc --noEmit` does not.
  const genDraft = (trpc.document.generateAIDraft.useMutation as any)({
    onSuccess: (d: { aiDraft: string }) => setContenido(d.aiDraft),
  })
  const save = (trpc.document.save.useMutation as any)({
    onSuccess: (d: { id: string }) => setDocId(d.id),
  })
  const sign = trpc.document.sign.useMutation()

  /**
   * Open the override modal. We don't yet send the override to the
   * server — that happens in the modal's "Generar" handler. The modal
   * pre-fills from the doctor's default preferences.
   */
  function openOverrideModal() {
    setShowOverrideModal(true)
  }

  /**
   * After the modal confirms, we have the override + the doctor wants to
   * proceed. We save the reportOverride on the Document FIRST (creates a
   * draft INFORME row if one doesn't exist), then call generateAIDraft
   * which now reads the override and emits only the requested sections.
   */
  async function handleOverrideConfirm(override: ReportOverride | null) {
    setShowOverrideModal(false)
    // Save the draft with the override. The save() mutation accepts
    // reportOverride. If a doc already exists (docId), update; else create.
    const savedDoc = await save.mutateAsync({
      id: docId ?? undefined,
      encounterId,
      patientRegistrationId: patientRegId,
      tipo: "INFORME",
      contenidoHtml: contenido,
      reportOverride: override ?? undefined,
    })
    setDocId(savedDoc.id)
    // Now generate the draft. generateAIDraft reads the override from
    // the most-recent INFORME row for this encounter (in document.ts).
    genDraft.mutate({ encounterId })
  }

  async function firmarYGenerar() {
    const savedDoc = await save.mutateAsync({
      id: docId ?? undefined,
      encounterId,
      patientRegistrationId: patientRegId,
      tipo: "INFORME",
      contenidoHtml: contenido,
    })
    await sign.mutateAsync({ id: savedDoc.id })
    window.open(`/api/pdf/document/${savedDoc.id}`, "_blank")
  }

  const isPending = save.isPending || sign.isPending

  return (
    <div className="space-y-3">
      {!disabled && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            disabled={genDraft.isPending}
            onClick={openOverrideModal}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Sparkles size={14} className="mr-2" />
            {genDraft.isPending ? "Generando con IA..." : "Generar borrador con IA"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDocTemplates(!showDocTemplates)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <BookOpen size={14} className="mr-2" />
            Plantillas
          </Button>
        </div>
      )}

      {!disabled && showDocTemplates && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-300">Plantillas de informe (legacy)</p>
            <button onClick={() => setShowDocTemplates(false)} className="text-slate-500 hover:text-slate-300">
              <X size={13} />
            </button>
          </div>

          <div className="rounded-md border border-amber-800/40 bg-amber-950/20 p-2 text-[10px] text-amber-300/80">
            Las plantillas guardadas siguen funcionando como fallback,
            pero el flujo recomendado es configurar tus{" "}
            <a href="/doctor/preferencias-informe" className="underline">
              preferencias de informe
            </a>{" "}
            y usar la IA.
          </div>

          {docTemplates.length === 0 && (
            <p className="text-xs text-slate-600">Sin plantillas guardadas.</p>
          )}

          {docTemplates.map((tmpl: any) => (
            <div key={tmpl.id} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/50 px-2 py-1.5">
              <span className="text-xs text-slate-300 truncate flex-1">{tmpl.nombre}</span>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => { setContenido(tmpl.contenidoHtml); setShowDocTemplates(false) }}
                  className="text-xs text-blue-400 hover:text-blue-300 px-1"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => deleteDocTmpl.mutate({ id: tmpl.id })}
                  className="text-slate-500 hover:text-red-400"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}

          <div className="border-t border-slate-800 pt-2">
            {!showSaveForm ? (
              <button
                onClick={() => setShowSaveForm(true)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                + Guardar contenido actual como plantilla
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={saveTmplName}
                  onChange={(e) => setSaveTmplName(e.target.value)}
                  placeholder="Nombre de la plantilla"
                  className="bg-slate-800 border-slate-700 text-white text-xs h-7 flex-1"
                />
                <button
                  disabled={!saveTmplName.trim() || !contenido || saveDocTmpl.isPending}
                  onClick={() => saveDocTmpl.mutate({ tipo: "INFORME", nombre: saveTmplName.trim(), contenidoHtml: contenido })}
                  className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  Guardar
                </button>
                <button onClick={() => setShowSaveForm(false)} className="text-xs text-slate-500 hover:text-slate-300">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Textarea
        rows={14}
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        disabled={disabled}
        placeholder={
          disabled
            ? "Consulta firmada — el informe no es editable."
            : "El borrador del informe aparecerá aquí. Edítelo antes de firmar."
        }
        className="font-mono text-xs leading-relaxed"
      />

      {!disabled && contenido && (
        <Button
          disabled={isPending}
          onClick={firmarYGenerar}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <FileText size={14} className="mr-2" />
          {isPending ? "Procesando..." : "Firmar y generar PDF"}
        </Button>
      )}

      {showOverrideModal && (
        <OverrideModal
          onConfirm={handleOverrideConfirm}
          onCancel={() => setShowOverrideModal(false)}
          isPending={save.isPending || genDraft.isPending}
        />
      )}
    </div>
  )
}

/**
 * Modal: per-consulta override of the doctor's default report preferences.
 *
 * Pre-fills with the doctor's default section set + default instructions
 * (from /doctor/preferencias-informe). The doctor can:
 *   - Toggle any section (add or remove for this consulta).
 *   - Add per-section instructions that override the default.
 *
 * The result is a ReportOverride delta (seccionesExtra / seccionesQuitadas
 * / instrucciones) that gets stored on Document.reportOverride and read
 * by lib/ai/generate-report.ts at generation time.
 *
 * See types/report.ts for the full shape.
 */
function OverrideModal({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: (override: ReportOverride | null) => void | Promise<void>
  onCancel: () => void
  isPending: boolean
}) {
  const { data: prefs, isLoading } = (trpc.reportPreferences.get.useQuery as any)(
    undefined,
  )

  // Local state seeded from the doctor's default prefs. We track the
  // "delta" against the default so we can produce a clean ReportOverride
  // shape (only the differences, not the full set).
  const [secciones, setSecciones] = useState<ReportSeccionesMap>(DEFAULT_REPORT_SECCIONES)
  const [instrucciones, setInstrucciones] = useState<ReportInstruccionesMap>({})
  const [defaultSecciones, setDefaultSecciones] = useState<ReportSeccionesMap>(DEFAULT_REPORT_SECCIONES)
  const [defaultInstrucciones, setDefaultInstrucciones] = useState<ReportInstruccionesMap>({})

  useEffect(() => {
    if (prefs?.secciones) {
      const sec = prefs.secciones as ReportSeccionesMap
      setSecciones(sec)
      setDefaultSecciones(sec)
    }
    if (prefs?.instruccionesDefault) {
      const ins = prefs.instruccionesDefault as ReportInstruccionesMap
      setInstrucciones(ins)
      setDefaultInstrucciones(ins)
    }
  }, [prefs?.secciones, prefs?.instruccionesDefault])

  function toggleSection(key: ReportSectionKey) {
    setSecciones((prev) => {
      const next = { ...prev }
      const cur = next[key] ?? DEFAULT_REPORT_SECCIONES[key]
      next[key] = !cur
      return next
    })
  }

  function setInstruction(key: ReportSectionKey, value: string) {
    setInstrucciones((prev) => {
      const next = { ...prev }
      if (value.trim()) {
        next[key] = value
      } else {
        delete next[key]
      }
      return next
    })
  }

  function buildOverride(): ReportOverride | null {
    const seccionesExtra: ReportSectionKey[] = []
    const seccionesQuitadas: ReportSectionKey[] = []
    for (const k of REPORT_SECTION_KEYS) {
      const currentEnabled = secciones[k] ?? DEFAULT_REPORT_SECCIONES[k]
      const defaultEnabled =
        defaultSecciones[k] ?? DEFAULT_REPORT_SECCIONES[k]
      if (currentEnabled && !defaultEnabled) seccionesExtra.push(k)
      if (!currentEnabled && defaultEnabled) seccionesQuitadas.push(k)
    }

    const instruccionesDelta: ReportInstruccionesMap = {}
    for (const k of REPORT_SECTION_KEYS) {
      const cur = instrucciones[k] ?? ""
      const def = defaultInstrucciones[k] ?? ""
      if (cur && cur !== def) instruccionesDelta[k] = cur
    }

    const override: ReportOverride = {}
    if (seccionesExtra.length > 0) override.seccionesExtra = seccionesExtra
    if (seccionesQuitadas.length > 0) override.seccionesQuitadas = seccionesQuitadas
    if (Object.keys(instruccionesDelta).length > 0) {
      override.instrucciones = instruccionesDelta
    }

    return Object.keys(override).length > 0 ? override : null
  }

  function handleConfirm() {
    void onConfirm(buildOverride())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Settings size={14} className="text-blue-400" />
              Personalizar este informe
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Marcadas con tu configuración por default. Cambiá lo que necesites
              solo para esta consulta.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Cargando tus preferencias...</span>
            </div>
          ) : (
            <>
              {REPORT_SECTION_KEYS.map((key) => {
                const enabled = secciones[key] ?? DEFAULT_REPORT_SECCIONES[key]
                const isDefault =
                  (defaultSecciones[key] ?? DEFAULT_REPORT_SECCIONES[key]) === enabled
                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-3 transition-colors ${
                      enabled
                        ? "border-slate-700 bg-slate-950/50"
                        : "border-slate-800 bg-slate-950/30 opacity-60"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggleSection(key)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-medium text-white">
                          {REPORT_SECTION_LABELS[key]}
                          {!isDefault && (
                            <span className="rounded-full bg-amber-900/40 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                              {enabled ? "+ agregada" : "− quitada"}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {REPORT_SECTION_DESCRIPTIONS[key]}
                        </p>
                      </div>
                    </label>

                    {enabled && (
                      <div className="mt-2 space-y-1 pl-7">
                        <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          <Sparkles size={10} />
                          Instrucción para esta consulta
                        </label>
                        <Textarea
                          rows={2}
                          maxLength={500}
                          value={instrucciones[key] ?? ""}
                          onChange={(e) => setInstruction(key, e.target.value)}
                          placeholder={
                            defaultInstrucciones[key]
                              ? `Override de tu instrucción default: "${defaultInstrucciones[key]}"`
                              : "Ej: Resaltar evolución favorable del cuadro"
                          }
                          className="border-slate-700 bg-slate-900 text-xs text-white placeholder:text-slate-600 focus:border-blue-500"
                        />
                        <p className="text-[10px] text-slate-600">
                          {(instrucciones[key] ?? "").length}/500. Si difiere de tu
                          default, se persiste solo para esta consulta.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-slate-800 bg-slate-900 px-5 py-3">
          <p className="text-xs text-slate-500">
            Si no cambiás nada, se usan tus preferencias por default.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={onCancel}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              disabled={isPending || isLoading}
              onClick={handleConfirm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="mr-1.5" />
                  Generar borrador
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

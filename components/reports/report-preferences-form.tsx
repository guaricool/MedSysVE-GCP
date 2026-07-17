"use client"

import { useEffect, useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, FileText, Sparkles, Check } from "lucide-react"
import {
  DEFAULT_REPORT_SECCIONES,
  REPORT_SECTION_DESCRIPTIONS,
  REPORT_SECTION_KEYS,
  REPORT_SECTION_LABELS,
  type ReportInstruccionesMap,
  type ReportSeccionesMap,
  type ReportSectionKey,
} from "@/types/report"

/**
 * Per-doctor customizable medical report preferences.
 *
 * Doctors configure once which sections appear in their informes (the
 * AI-generated draft) and any standing instructions per section. At
 * informe time the resolver (resolveReportSections in types/report.ts)
 * merges these defaults with the per-consulta override from the
 * Document.reportOverride JSON column.
 *
 * First-time visit: shows DEFAULT_REPORT_SECCIONES + empty instructions.
 * Saving upserts the row in DoctorReportPreferences.
 */
export function ReportPreferencesForm() {
  const { data: prefs, isLoading } = (trpc.reportPreferences.get.useQuery as any)(
    undefined,
  )
  const utils = trpc.useUtils()
  const upsert = (trpc.reportPreferences.upsert.useMutation as any)({
    onSuccess: () => {
      utils.reportPreferences.get.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  // Local state for the form. Initialized from the query; on first
  // render with no data yet, we seed with DEFAULT_REPORT_SECCIONES so
  // the checkboxes show a sensible default.
  const [secciones, setSecciones] = useState<ReportSeccionesMap>(DEFAULT_REPORT_SECCIONES)
  const [instrucciones, setInstrucciones] = useState<ReportInstruccionesMap>({})
  const [saved, setSaved] = useState(false)

  // Sync from server data once it loads.
  useEffect(() => {
    if (prefs?.secciones) {
      setSecciones(prefs.secciones as ReportSeccionesMap)
    }
    if (prefs?.instruccionesDefault) {
      setInstrucciones(prefs.instruccionesDefault as ReportInstruccionesMap)
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

  function handleSave() {
    upsert.mutate({
      secciones: Object.fromEntries(
        REPORT_SECTION_KEYS.map((k) => [k, secciones[k] ?? DEFAULT_REPORT_SECCIONES[k]]),
      ) as Record<ReportSectionKey, boolean>,
      instruccionesDefault: instrucciones as Record<ReportSectionKey, string>,
    })
  }

  function handleReset() {
    setSecciones(DEFAULT_REPORT_SECCIONES)
    setInstrucciones({})
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Cargando preferencias…</span>
      </div>
    )
  }

  const enabledCount = REPORT_SECTION_KEYS.filter(
    (k) => secciones[k] ?? DEFAULT_REPORT_SECCIONES[k],
  ).length

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-sm text-slate-300">
          Estas preferencias se aplican a <strong>TODOS</strong> tus informes
          médicos por default. En una consulta específica, podés agregar
          secciones extras o instrucciones puntuales al generar el informe
          (override por-consulta).
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Tienes {enabledCount} de {REPORT_SECTION_KEYS.length} secciones activas. Cambiá
          esto cuando quieras; la próxima vez que generes un informe la IA
          usará tu selección.
        </p>
      </div>

      <div className="space-y-3">
        {REPORT_SECTION_KEYS.map((key) => {
          const enabled = secciones[key] ?? DEFAULT_REPORT_SECCIONES[key]
          return (
            <div
              key={key}
              className={`rounded-lg border p-4 transition-colors ${
                enabled
                  ? "border-slate-700 bg-slate-900/40"
                  : "border-slate-800 bg-slate-950/40 opacity-60"
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
                  <p className="text-sm font-medium text-white">
                    {REPORT_SECTION_LABELS[key]}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {REPORT_SECTION_DESCRIPTIONS[key]}
                  </p>
                </div>
              </label>

              {enabled && (
                <div className="mt-3 space-y-1.5 pl-7">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <Sparkles size={10} />
                    Instrucción por defecto (opcional)
                  </label>
                  <Textarea
                    rows={2}
                    maxLength={500}
                    value={instrucciones[key] ?? ""}
                    onChange={(e) => setInstruction(key, e.target.value)}
                    placeholder={`Ej: "Siempre resaltar antecedentes cardiovasculares"`}
                    className="border-slate-700 bg-slate-950 text-xs text-white placeholder:text-slate-600 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-600">
                    {(instrucciones[key] ?? "").length}/500 caracteres.
                    La IA sigue esta regla en CADA informe tuyo. Podés
                    sobreescribirla en una consulta específica si hace falta.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
        <Button
          disabled={upsert.isPending}
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {upsert.isPending ? (
            <>
              <Loader2 size={14} className="mr-1.5 animate-spin" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <Check size={14} className="mr-1.5" />
              Guardado
            </>
          ) : (
            <>
              <Save size={14} className="mr-1.5" />
              Guardar preferencias
            </>
          )}
        </Button>
        <Button
          variant="outline"
          disabled={upsert.isPending}
          onClick={handleReset}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Restaurar defaults
        </Button>
        {prefs?.isDefault && (
          <p className="text-xs text-slate-500">
            Aún no has guardado tus preferencias — estás viendo los defaults.
          </p>
        )}
      </div>
    </div>
  )
}

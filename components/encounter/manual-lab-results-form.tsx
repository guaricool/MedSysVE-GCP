"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import {
  Plus,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Sparkles,
} from "lucide-react"

/**
 * Manual lab / exam results entry form.
 *
 * Allows the doctor to:
 *   - Type a free-text result (the legacy OCR-paste flow).
 *   - Add structured values (parametro, valor, unidad, rangoReferencia)
 *     which feed the LabResult.trends chart and the trend page.
 *   - Add internal notes.
 *
 * All fields are optional but at least one of (resultado, valores) must be
 * non-empty for the save to be allowed.
 */

interface ValueRow {
  parametro: string
  valor: string
  unidad: string
  rangoReferencia: string
  interpretado: "NORMAL" | "BAJO" | "ALTO" | "CRITICO" | ""
}

interface Props {
  patientRegistrationId: string
  encounterId?: string
  disabled?: boolean
  ocrData?: any
}

const EMPTY_VALUE: ValueRow = {
  parametro: "",
  valor: "",
  unidad: "",
  rangoReferencia: "",
  interpretado: "",
}

/**
 * Heuristic to determine interpretation based on the value and reference range.
 * Supports common formats:
 *   - "70-100"  → range
 *   - "< 200"   → upper bound only
 *   - "> 40"    → lower bound only
 *   - "Negativo" → text result (no numeric interpretation)
 */
function interpretar(
  valor: string,
  rango: string | undefined,
): "NORMAL" | "BAJO" | "ALTO" | "CRITICO" | "" {
  if (!rango) return ""
  const numValor = parseFloat(valor.replace(",", "."))
  if (isNaN(numValor)) return ""

  const r = rango.trim()
  const matchRange = r.match(/^([\d.,]+)\s*-\s*([\d.,]+)$/)
  if (matchRange) {
    const min = parseFloat(matchRange[1].replace(",", "."))
    const max = parseFloat(matchRange[2].replace(",", "."))
    if (numValor < min) return numValor < min * 0.5 ? "CRITICO" : "BAJO"
    if (numValor > max) return numValor > max * 1.5 ? "CRITICO" : "ALTO"
    return "NORMAL"
  }
  const matchUpper = r.match(/^<\s*([\d.,]+)$/)
  if (matchUpper) {
    const max = parseFloat(matchUpper[1].replace(",", "."))
    if (numValor > max) return numValor > max * 1.5 ? "CRITICO" : "ALTO"
    return "NORMAL"
  }
  const matchLower = r.match(/^>\s*([\d.,]+)$/)
  if (matchLower) {
    const min = parseFloat(matchLower[1].replace(",", "."))
    if (numValor < min) return numValor < min * 0.5 ? "CRITICO" : "BAJO"
    return "NORMAL"
  }
  return ""
}

export function ManualLabResultsForm({
  patientRegistrationId,
  encounterId,
  disabled,
  ocrData,
}: Props) {
  const [titulo, setTitulo] = useState("")
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [resultado, setResultado] = useState("")
  const [notas, setNotas] = useState("")
  const [valores, setValores] = useState<ValueRow[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (ocrData) {
      if (ocrData.valores && Array.isArray(ocrData.valores)) {
        const newRows: ValueRow[] = ocrData.valores.map((v: any) => {
          const row: ValueRow = {
            parametro: v.parametro || "",
            valor: v.valor || "",
            unidad: v.unidad || "",
            rangoReferencia: v.rangoReferencia || "",
            interpretado: "",
          }
          row.interpretado = interpretar(row.valor, row.rangoReferencia)
          return row
        })
        setValores((prev) => [...prev, ...newRows])
      }
      if (ocrData.notasOriginales) {
        setNotas((prev) => prev ? prev + "\n\n--- Notas Originales ---\n" + ocrData.notasOriginales : "--- Notas Originales ---\n" + ocrData.notasOriginales)
      }
    }
  }, [ocrData])

  const utils = trpc.useUtils()

  const save = trpc.labResult.save.useMutation({
    onSuccess: () => {
      utils.labResult.list.invalidate({ patientRegistrationId })
      // Reset form
      setTitulo("")
      setResultado("")
      setNotas("")
      setValores([])
      setShowAdvanced(false)
    },
  })

  function agregarValor() {
    setValores((prev) => [...prev, { ...EMPTY_VALUE }])
  }

  function actualizarValor(idx: number, campo: keyof ValueRow, valor: string) {
    setValores((prev) => {
      const next = [...prev]
      const row = { ...next[idx], [campo]: valor }
      // Auto-interpretar si cambia valor o rangoReferencia
      if (campo === "valor" || campo === "rangoReferencia") {
        const interp = interpretar(row.valor, row.rangoReferencia)
        if (interp) row.interpretado = interp
        else if (row.interpretado && campo === "rangoReferencia") {
          // Si cambió el rango, recalcular
          row.interpretado = interp
        }
      }
      next[idx] = row
      return next
    })
  }

  function eliminarValor(idx: number) {
    setValores((prev) => prev.filter((_, i) => i !== idx))
  }

  function interpretarManual(idx: number, val: ValueRow["interpretado"]) {
    setValores((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], interpretado: val }
      return next
    })
  }

  const canSave =
    titulo.trim().length > 0 &&
    (resultado.trim().length > 0 || valores.length > 0) &&
    !save.isPending

  // Common labs autocomplete
  const COMMON_LABS = [
    "Hemoglobina",
    "Hematocrito",
    "Leucocitos",
    "Plaquetas",
    "Glucosa en ayunas",
    "Glucosa postprandial",
    "HbA1c",
    "Colesterol total",
    "HDL",
    "LDL",
    "Triglicéridos",
    "Creatinina",
    "BUN",
    "Ácido úrico",
    "TGO (AST)",
    "TGP (ALT)",
    "TSH",
    "T4 libre",
    "PSA total",
    "Hemoglobina glicosilada",
  ]

  return (
    <div className="space-y-3">
      {/* ─── Encabezado: título + fecha ─── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs text-slate-400">Tipo de examen</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            list="common-labs"
            placeholder="Ej: Hemograma completo, Perfil lipídico, Glucosa en ayunas..."
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <datalist id="common-labs">
            {COMMON_LABS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Fecha del examen</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ─── Valores estructurados ─── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs text-slate-400">
            Valores estructurados{" "}
            <span className="text-slate-600">(alimentan las gráficas de tendencia)</span>
          </label>
          <button
            type="button"
            onClick={agregarValor}
            className="flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            <Plus size={11} /> Agregar parámetro
          </button>
        </div>

        {valores.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-700 bg-slate-950/30 px-3 py-3 text-center text-xs text-slate-500">
            Aún no agregaste parámetros. Puedes agregar valores estructurados o
            pegar texto libre más abajo.
          </p>
        ) : (
          <div className="space-y-2">
            {valores.map((row, idx) => (
              <div
                key={idx}
                className="rounded-md border border-slate-700 bg-slate-900/60 p-2"
              >
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Parámetro"
                    value={row.parametro}
                    onChange={(e) => actualizarValor(idx, "parametro", e.target.value)}
                    className="col-span-4 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Valor"
                    value={row.valor}
                    onChange={(e) => actualizarValor(idx, "valor", e.target.value)}
                    className="col-span-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Unidad"
                    value={row.unidad}
                    onChange={(e) => actualizarValor(idx, "unidad", e.target.value)}
                    className="col-span-1 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Rango ref. (ej: 70-100)"
                    value={row.rangoReferencia}
                    onChange={(e) =>
                      actualizarValor(idx, "rangoReferencia", e.target.value)
                    }
                    className="col-span-3 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="col-span-2 flex items-center gap-1">
                    {row.interpretado ? (
                      <InterpretacionBadge value={row.interpretado} />
                    ) : (
                      <span className="text-[10px] text-slate-600">—</span>
                    )}
                    <button
                      type="button"
                      onClick={() => eliminarValor(idx)}
                      className="ml-auto rounded p-1 text-slate-500 hover:bg-red-950/40 hover:text-red-400"
                      title="Eliminar fila"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
                {/* Manual override de interpretación */}
                <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                  <span className="text-slate-600">Marcar:</span>
                  {(["NORMAL", "BAJO", "ALTO", "CRITICO"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => interpretarManual(idx, opt)}
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        row.interpretado === opt
                          ? interpretacionColor(opt)
                          : "text-slate-500 hover:bg-slate-800"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                  {row.interpretado && (
                    <button
                      type="button"
                      onClick={() => interpretarManual(idx, "")}
                      className="ml-1 text-slate-600 hover:text-slate-400"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Texto libre (opcional) ─── */}
      <details
        className="rounded-md border border-slate-800 bg-slate-900/30"
        open={showAdvanced}
        onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer px-3 py-2 text-xs text-slate-400 hover:text-slate-300">
          {showAdvanced ? <ChevronUp size={11} className="inline" /> : <ChevronDown size={11} className="inline" />}{" "}
          Texto libre / Pegar del OCR
        </summary>
        <div className="px-3 pb-3">
          <textarea
            value={resultado}
            onChange={(e) => setResultado(e.target.value)}
            rows={4}
            placeholder="Pegue aquí el texto del examen (por ejemplo, el resultado del OCR)..."
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </details>

      {/* ─── Notas internas ─── */}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">
          Notas / Interpretación (opcional)
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          placeholder="Ej: Paciente presenta hipercolesterolemia leve. Se indica dieta y control en 3 meses..."
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* ─── Botón guardar ─── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!canSave}
          onClick={() =>
            save.mutate({
              patientRegistrationId,
              encounterId,
              titulo,
              fecha,
              resultado: resultado || valores.map((v) => `${v.parametro}: ${v.valor}`).join("\n"),
              valores: valores
                .filter((v) => v.parametro.trim() && v.valor.trim())
                .map((v) => ({
                  parametro: v.parametro,
                  valor: v.valor,
                  unidad: v.unidad || null,
                  rangoReferencia: v.rangoReferencia || null,
                  interpretado: (v.interpretado || null) as
                    | "NORMAL"
                    | "BAJO"
                    | "ALTO"
                    | "CRITICO"
                    | null,
                })),
              notas: notas || undefined,
            })
          }
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={13} />
          {save.isPending ? "Guardando..." : "Guardar resultado"}
        </button>
        {save.isSuccess && (
          <span className="text-xs text-green-400">✓ Resultado guardado</span>
        )}
        {save.error && (
          <span className="text-xs text-red-400">{save.error.message}</span>
        )}
      </div>
    </div>
  )
}

function InterpretacionBadge({ value }: { value: ValueRow["interpretado"] }) {
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${interpretacionColor(value)}`}>{value}</span>
}

function interpretacionColor(value: ValueRow["interpretado"]): string {
  switch (value) {
    case "NORMAL":
      return "bg-emerald-900/40 text-emerald-300"
    case "BAJO":
      return "bg-blue-900/40 text-blue-300"
    case "ALTO":
      return "bg-amber-900/40 text-amber-300"
    case "CRITICO":
      return "bg-red-900/40 text-red-300"
    default:
      return "bg-slate-800 text-slate-400"
  }
}
"use client"

import { useState, useRef, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { trpc } from "@/lib/trpc-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pill, Plus } from "lucide-react"

export type MedicationSearchResult = {
  id: string
  nombreGenerico: string
  nombresComerciales: string[]
  concentraciones: string[]
  categoria: string
}

interface Props {
  encounterId: string
  disabled?: boolean
  onSelect: (med: MedicationSearchResult) => void
}

/**
 * Medication autocomplete + option to add a custom medication on the fly.
 *
 * Flow when the doctor can't find a medication in the catalog:
 *  - Click "+ Agregar medicamento nuevo" → opens modal/form.
 *  - Enter nombre genérico, nombres comerciales, concentración, forma, vía.
 *  - Submit → calls medication.addCustom → reloads search → user picks it.
 *
 * Custom medications are marked isCustom=true so they're distinguishable in
 * the catalog and can be promoted to "official" later if widely used.
 */
export function MedicationSearch({ encounterId, disabled, onSelect }: Props) {
  const [query, setQuery] = useState("")
  const [showCustom, setShowCustom] = useState(false)
  // The medication dropdown must be rendered in a portal — the parent
  // <Section> collapse in encounter-workspace uses `overflow-hidden`
  // to animate grid-rows-[0fr→1fr], which clips any position:absolute
  // child. Portalling to document.body escapes that containing block.
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dropdownPos, setDropdownPos] = useState<
    { top: number; left: number; width: number } | null
  >(null)

  const isOpen = query.trim().length >= 2 && !showCustom

  useLayoutEffect(() => {
    if (!isOpen || !inputRef.current) {
      setDropdownPos(null)
      return
    }
    const recalc = () => {
      const r = inputRef.current!.getBoundingClientRect()
      setDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    recalc()
    window.addEventListener("resize", recalc)
    window.addEventListener("scroll", recalc, true)
    return () => {
      window.removeEventListener("resize", recalc)
      window.removeEventListener("scroll", recalc, true)
    }
  }, [isOpen, query, showCustom])

  const { data: results = [], isFetching }: { data: any[]; isFetching: boolean } =
    (trpc.medication.search.useQuery as any)(
      { query },
      { enabled: query.trim().length >= 2 && !showCustom },
    )

  const utils = (trpc as any).useUtils()
  const addCustom = (trpc.medication.addCustom.useMutation as any)({
    onSuccess: async (newMed: any) => {
      // Invalidate the search so the new med shows up immediately.
      await utils.medication.search.invalidate({ query })
      setShowCustom(false)
      // Auto-select the newly created med.
      onSelect({
        id: newMed.id,
        nombreGenerico: newMed.nombreGenerico,
        nombresComerciales: newMed.nombresComerciales,
        concentraciones: newMed.concentraciones,
        categoria: newMed.categoria,
      })
      setQuery("")
    },
  })

  if (disabled) return null

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="relative">
          <Pill
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <Input
            ref={inputRef}
            placeholder="Buscar medicamento (nombre genérico o comercial)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowCustom(false)}
            className="border-slate-700 bg-slate-800 pl-9 text-white placeholder:text-slate-500"
          />
        </div>
        {isOpen && dropdownPos &&
          typeof document !== "undefined" &&
          createPortal(
            <ul
              style={{
                position: "fixed",
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
              }}
              className="z-[100] mt-1 max-h-64 overflow-auto rounded border border-slate-700 bg-slate-800 shadow-xl"
            >
              {isFetching && (
                <li className="px-3 py-2 text-sm text-slate-400">Buscando...</li>
              )}
              {!isFetching && results.length === 0 && (
                <li className="space-y-2 px-3 py-2">
                  <p className="text-sm text-slate-400">
                    Sin resultados para "{query}".
                  </p>
                  <button
                    onClick={() => setShowCustom(true)}
                    className="flex w-full items-center gap-1.5 rounded border border-blue-700 bg-blue-950/30 px-2 py-1.5 text-xs text-blue-300 hover:bg-blue-900/40"
                  >
                    <Plus size={11} />
                    Agregar "{query}" como medicamento nuevo
                  </button>
                </li>
              )}
              {results.map((med) => (
                <li key={med.id}>
                  <button
                    className="flex w-full items-start justify-between gap-4 px-3 py-2 text-left text-sm hover:bg-slate-700"
                    onClick={() => {
                      onSelect(med)
                      setQuery("")
                    }}
                  >
                    <div>
                      <span className="font-medium text-white">{med.nombreGenerico}</span>
                      {med.nombresComerciales.length > 0 && (
                        <span className="ml-2 text-xs text-slate-400">
                          ({med.nombresComerciales.slice(0, 2).join(", ")})
                        </span>
                      )}
                      {med.concentraciones.length > 0 && (
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {med.concentraciones.slice(0, 3).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                      {med.categoria}
                    </span>
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )}
      </div>

      {/* Quick-add custom medication button (always visible) */}
      {!showCustom && query.trim().length < 2 && (
        <button
          onClick={() => setShowCustom(true)}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
        >
          <Plus size={11} />
          ¿No lo encuentra? Agregar medicamento nuevo
        </button>
      )}

      {/* Custom medication form */}
      {showCustom && (
        <CustomMedicationForm
          initialName={query}
          onCancel={() => setShowCustom(false)}
          onSubmit={async (data) => {
            await addCustom.mutateAsync(data)
          }}
          isPending={addCustom.isPending}
        />
      )}
    </div>
  )
}

function CustomMedicationForm({
  initialName,
  onCancel,
  onSubmit,
  isPending,
}: {
  initialName: string
  onCancel: () => void
  onSubmit: (data: {
    nombreGenerico: string
    nombresComerciales: string[]
    concentraciones: string[]
    formaFarmaceutica: string
    viaAdministracion: string
    categoria: string
  }) => Promise<void>
  isPending: boolean
}) {
  const [nombreGenerico, setNombreGenerico] = useState(initialName)
  const [comercial, setComercial] = useState("")
  const [concentracion, setConcentracion] = useState("")
  const [forma, setForma] = useState("Tableta")
  const [via, setVia] = useState("Oral")
  const [categoria, setCategoria] = useState("Personalizado")

  const canSubmit = nombreGenerico.trim().length >= 3

  return (
    <div className="space-y-3 rounded-lg border border-blue-700/50 bg-blue-950/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
        Agregar medicamento personalizado
      </p>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-slate-400">
          Nombre genérico *
        </label>
        <Input
          value={nombreGenerico}
          onChange={(e) => setNombreGenerico(e.target.value)}
          placeholder="Ej: Paracetamol"
          className="border-slate-700 bg-slate-800 text-sm text-white"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-400">
            Nombre comercial
          </label>
          <Input
            value={comercial}
            onChange={(e) => setComercial(e.target.value)}
            placeholder="Opcional"
            className="border-slate-700 bg-slate-800 text-sm text-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-400">
            Concentración
          </label>
          <Input
            value={concentracion}
            onChange={(e) => setConcentracion(e.target.value)}
            placeholder="Ej: 500 mg"
            className="border-slate-700 bg-slate-800 text-sm text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-400">
            Forma
          </label>
          <select
            value={forma}
            onChange={(e) => setForma(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
          >
            <option>Tableta</option>
            <option>Cápsula</option>
            <option>Jarabe</option>
            <option>Suspensión</option>
            <option>Inyectable</option>
            <option>Gotas</option>
            <option>Crema</option>
            <option>Ungüento</option>
            <option>Supositorio</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-400">
            Vía
          </label>
          <select
            value={via}
            onChange={(e) => setVia(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
          >
            <option>Oral</option>
            <option>Intramuscular</option>
            <option>Intravenosa</option>
            <option>Subcutánea</option>
            <option>Tópica</option>
            <option>Inhalatoria</option>
            <option>Sublingual</option>
            <option>Rectal</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-400">
            Categoría
          </label>
          <Input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ej: Antibiótico"
            className="border-slate-700 bg-slate-800 text-sm text-white"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="border-slate-700 text-slate-300"
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          disabled={!canSubmit || isPending}
          onClick={() =>
            onSubmit({
              nombreGenerico: nombreGenerico.trim(),
              nombresComerciales: comercial.trim() ? [comercial.trim()] : [],
              concentraciones: concentracion.trim() ? [concentracion.trim()] : [],
              formaFarmaceutica: forma,
              viaAdministracion: via,
              categoria: categoria.trim() || "Personalizado",
            })
          }
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? "Guardando..." : "Crear y agregar"}
        </Button>
      </div>
    </div>
  )
}
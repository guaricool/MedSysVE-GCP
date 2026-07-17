"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { trpc } from "@/lib/trpc-client"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface Props {
  encounterId: string
  disabled?: boolean
}

export function DiagnosisSearch({ encounterId, disabled }: Props) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)
  const utils = trpc.useUtils()

  const { data: enc } = trpc.encounter.get.useQuery({ id: encounterId })
  const { data: results = [] } = trpc.icd10.search.useQuery(
    { query },
    { enabled: query.trim().length >= 1 },
  )

  const add = trpc.encounter.addDiagnosis.useMutation({
    onSuccess: () => {
      utils.encounter.get.invalidate({ id: encounterId })
      setQuery("")
      setOpen(false)
    },
  })

  const remove = trpc.encounter.removeDiagnosis.useMutation({
    onSuccess: () => utils.encounter.get.invalidate({ id: encounterId }),
  })

  // Position the dropdown below the input using fixed coordinates so it escapes
  // any `overflow-hidden` ancestor (the encounter Section uses grid-rows
  // animation with overflow-hidden which would otherwise clip the popup).
  useEffect(() => {
    if (!open || !inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [open, query, results])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (
        inputRef.current && !inputRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const showDropdown = open && !disabled && query.trim().length >= 1 && (results.length > 0 || query.trim().length >= 3) && dropdownPos

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {enc?.diagnoses.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm"
          >
            <span className="text-slate-200">
              <strong className="text-blue-400">{d.codigoCie10}</strong> — {d.descripcion}
              <em className="ml-2 text-xs text-slate-400">
                ({d.tipo === "PRINCIPAL" ? "Principal" : "Secundario"})
              </em>
            </span>
            {!disabled && (
              <button
                onClick={() => remove.mutate({ id: d.id })}
                className="ml-2 text-slate-500 hover:text-red-400"
                title="Eliminar diagnóstico"
              >
                <X size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {!disabled && (
        <Input
          ref={inputRef}
          placeholder="Buscar CIE-10 (código o descripción)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              if (results.length > 0) {
                add.mutate({
                  encounterId,
                  codigoCie10: results[0].codigo,
                  descripcion: results[0].descripcion,
                  tipo: "PRINCIPAL",
                })
              } else if (query.trim().length >= 3) {
                add.mutate({
                  encounterId,
                  codigoCie10: "S/C",
                  descripcion: query.trim(),
                  tipo: "PRINCIPAL",
                })
              }
            }
          }}
          className="bg-slate-800 border-slate-700 text-white"
        />
      )}

      {showDropdown && typeof document !== "undefined" && createPortal(
        <ul
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 60,
          }}
          className="max-h-80 overflow-auto rounded border border-slate-600 bg-slate-800 shadow-2xl"
        >
          {results.map((c) => (
            <li key={c.codigo}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
                onClick={() => {
                  add.mutate({
                    encounterId,
                    codigoCie10: c.codigo,
                    descripcion: c.descripcion,
                    tipo: "PRINCIPAL",
                  })
                }}
              >
                <span>{c.descripcion}</span>
                <span className="ml-4 shrink-0 font-mono text-xs text-slate-400">{c.codigo}</span>
              </button>
            </li>
          ))}
          
          {query.trim().length >= 3 && (
            <li>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 border-t border-slate-700"
                onClick={() => {
                  add.mutate({
                    encounterId,
                    codigoCie10: "S/C",
                    descripcion: query.trim(),
                    tipo: "PRINCIPAL",
                  })
                }}
              >
                <span className="italic">Añadir "{query.trim()}" (Personalizado)</span>
                <span className="ml-4 shrink-0 font-mono text-xs text-slate-400">Sin código</span>
              </button>
            </li>
          )}
        </ul>,
        document.body,
      )}
    </div>
  )
}

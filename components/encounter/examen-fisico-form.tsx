"use client"

import { useState, useEffect, useRef } from "react"
import { trpc } from "@/lib/trpc-client"
import { useEncounterVersion } from "./use-encounter-version"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled: boolean
  initialExamenFisico?: string
  /** Audit S9 (2026-07-07): initial version from parent encounter query. */
  initialVersion?: number
}

export function ExamenFisicoForm({
  encounterId,
  disabled,
  initialExamenFisico,
  initialVersion,
}: Props) {
  const [value, setValue] = useState(initialExamenFisico ?? "")
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { setDirty } = useUnsaved()

  useEffect(() => {
    if (initialExamenFisico !== undefined) {
      setValue(initialExamenFisico)
    }
  }, [initialExamenFisico])

  const { version, registerVersion, conflictDetected, ackConflict, handleTrpcError } =
    useEncounterVersion({ initialVersion })
  const utils = trpc.useUtils()
  const refetch = () => utils.encounter.get.invalidate({ id: encounterId })

  // tsc TS2589 workaround (audit S9): see vitals-form.tsx for context. The
  // DoctorFeatureOverride relation back from Doctor makes the inferred
  // tRPC RouterOutput tree deeper, which trips TS2589 here.
  const save = (trpc.encounter.update.useMutation as any)({
    onSuccess: (data: { version?: number }) => {
      setSaved(true)
      setDirty("examen-fisico", false)
      setTimeout(() => setSaved(false), 2000)
      if (typeof data.version === "number") registerVersion(data.version)
    },
    onError: (err: unknown) => {
      if (handleTrpcError(err)) void refetch()
    },
  })

  function schedule(text: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSaved(false)
    setDirty("examen-fisico", true)
    timerRef.current = setTimeout(() => {
      save.mutate({
        id: encounterId,
        examenFisico: text || undefined,
        ...(version !== undefined ? { version } : {}),
      })
    }, 1500)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  if (disabled) {
    return value
      ? <p className="whitespace-pre-wrap text-sm text-slate-300">{value}</p>
      : <p className="text-sm text-slate-500">Sin examen físico registrado.</p>
  }

  return (
    <div className="space-y-2">
      {conflictDetected && (
        <div className="rounded-md border border-amber-700 bg-amber-950/40 p-2 text-xs text-amber-200" role="alert">
          Otro doctor modificó esta consulta. Recarga para ver los datos actuales.
          <button type="button" className="ml-2 underline" onClick={ackConflict}>OK</button>
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); schedule(e.target.value) }}
        rows={5}
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none resize-y"
        placeholder="Ej: Estado general: consciente, orientado, afebril. Pulmones: murmullo vesicular conservado. Corazón: RCR, sin soplos. Abdomen: blando, depresible, no doloroso..."
      />
      <p className="text-xs text-slate-600">
        {save.isPending ? "Guardando..." : saved ? "✓ Guardado" : "Guardado automáticamente"}
      </p>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { trpc } from "@/lib/trpc-client"
import { useEncounterVersion } from "./use-encounter-version"

interface Props {
  encounterId: string
  disabled: boolean
  initialPlan?: string
  /** Audit S9 (2026-07-07): initial version from parent encounter query. */
  initialVersion?: number
}

export function PlanForm({
  encounterId,
  disabled,
  initialPlan,
  initialVersion,
}: Props) {
  const [plan, setPlan] = useState(initialPlan ?? "")
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { version, registerVersion, conflictDetected, ackConflict, handleTrpcError } =
    useEncounterVersion({ initialVersion })
  const utils = trpc.useUtils()
  const refetch = () => utils.encounter.get.invalidate({ id: encounterId })

  // tsc TS2589 workaround (audit S9, S10): see vitals-form.tsx for context.
  // next build runs tsc with --incremental which trips TS2589 here even
  // though plain `tsc --noEmit` (used by our test command) does not.
  const save = (trpc.encounter.update.useMutation as any)({
    onSuccess: (data: { version?: number }) => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      if (typeof data.version === "number") registerVersion(data.version)
    },
    onError: (err: unknown) => {
      if (handleTrpcError(err)) void refetch()
    },
  })

  function schedule(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSaved(false)
    timerRef.current = setTimeout(() => {
      save.mutate({
        id: encounterId,
        plan: value || undefined,
        ...(version !== undefined ? { version } : {}),
      })
    }, 1500)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  if (disabled) {
    return plan
      ? <p className="whitespace-pre-wrap text-sm text-slate-300">{plan}</p>
      : <p className="text-sm text-slate-500">Sin plan registrado.</p>
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
        value={plan}
        onChange={(e) => { setPlan(e.target.value); schedule(e.target.value) }}
        rows={5}
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none resize-y"
        placeholder="Indicaciones, medicamentos, próximos pasos, citas de seguimiento..."
      />
      <p className="text-xs text-slate-600">
        {save.isPending ? "Guardando..." : saved ? "✓ Guardado" : "Guardado automáticamente"}
      </p>
    </div>
  )
}

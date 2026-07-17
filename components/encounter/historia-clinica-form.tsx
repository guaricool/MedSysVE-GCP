"use client"

import { useState, useEffect, useRef } from "react"
import { trpc } from "@/lib/trpc-client"
import { useEncounterVersion } from "./use-encounter-version"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled: boolean
  initialMotivo?: string
  initialHistoriaClinica?: string
  /** Initial version from the parent encounter query (audit S9). */
  initialVersion?: number
}

export function HistoriaClinicaForm({
  encounterId,
  disabled,
  initialMotivo,
  initialHistoriaClinica,
  initialVersion,
}: Props) {
  const [motivo, setMotivo] = useState(initialMotivo ?? "")
  const [historiaClinica, setHistoriaClinica] = useState(initialHistoriaClinica ?? "")
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { setDirty } = useUnsaved()

  useEffect(() => {
    if (initialMotivo !== undefined) {
      setMotivo(initialMotivo)
    }
  }, [initialMotivo])

  useEffect(() => {
    if (initialHistoriaClinica !== undefined) {
      setHistoriaClinica(initialHistoriaClinica)
    }
  }, [initialHistoriaClinica])

  // Audit S9 (2026-07-07): optimistic-locking version tracking.
  const {
    version,
    registerVersion,
    conflictDetected,
    ackConflict,
    handleTrpcError,
  } = useEncounterVersion({ initialVersion })

  // Refetch on conflict so the form re-syncs with the server-side reality.
  const utils = trpc.useUtils()
  const refetch = () => utils.encounter.get.invalidate({ id: encounterId })

  // tsc TS2589 workaround (audit S9): see components/encounter/vitals-form.tsx.
  // Same root cause — recursive type explosion after adding `version` to
  // Encounter row type. Casting through `any` here is safe (no PHI exposure
  // vector; the React props/types still validate the rest of the form).
  const save = (trpc.encounter.update.useMutation as any)({
    onSuccess: (data: { version?: number }) => {
      setSaved(true)
      setDirty("historia-clinica", false)
      setTimeout(() => setSaved(false), 2000)
      if (typeof data.version === "number") registerVersion(data.version)
    },
    onError: (err: unknown) => {
      if (handleTrpcError(err)) {
        // CONFLICT — refetch so the doctor sees the server's current state.
        void refetch()
      }
    },
  })

  function schedule(data: { motivo: string; historiaClinica: string }) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSaved(false)
    setDirty("historia-clinica", true)
    timerRef.current = setTimeout(() => {
      save.mutate({
        id: encounterId,
        motivo: data.motivo || undefined,
        historiaClinica: data.historiaClinica || undefined,
        // audit S9: send version to enable optimistic locking. If unknown
        // (initial load race), omit it — server falls back to last-write-wins.
        ...(version !== undefined ? { version } : {}),
      })
    }, 1500)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  if (disabled) {
    return (
      <div className="space-y-3">
        {motivo && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Motivo de consulta</p>
            <p className="text-sm text-slate-300">{motivo}</p>
          </div>
        )}
        {historiaClinica && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Historia clínica</p>
            <p className="whitespace-pre-wrap text-sm text-slate-300">{historiaClinica}</p>
          </div>
        )}
        {!motivo && !historiaClinica && (
          <p className="text-sm text-slate-500">Sin registro.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {conflictDetected && (
        <div
          className="rounded-md border border-amber-700 bg-amber-950/40 p-2 text-xs text-amber-200"
          role="alert"
        >
          Otro doctor (o auto-save) modificó esta consulta. Tus cambios
          pendientes pueden haberse sobrescrito — los datos del servidor se
          recargaron automáticamente.
          <button
            type="button"
            className="ml-2 underline text-amber-100 hover:text-white"
            onClick={ackConflict}
          >
            OK
          </button>
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs text-slate-400">Motivo de consulta</label>
        <input
          type="text"
          value={motivo}
          onChange={(e) => { setMotivo(e.target.value); schedule({ motivo: e.target.value, historiaClinica }) }}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
          placeholder="Ej: Dolor de cabeza persistente..."
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Historia clínica</label>
        <textarea
          value={historiaClinica}
          onChange={(e) => { setHistoriaClinica(e.target.value); schedule({ motivo, historiaClinica: e.target.value }) }}
          rows={5}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none resize-y"
          placeholder="Historia clínica, antecedentes, síntomas..."
        />
      </div>
      <p className="text-xs text-slate-600">
        {save.isPending ? "Guardando..." : saved ? "✓ Guardado" : "Guardado automáticamente"}
      </p>
    </div>
  )
}

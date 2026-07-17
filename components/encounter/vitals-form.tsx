"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"
import { calcularImc, clasificarImc } from "@/lib/clinical/imc"
import { evaluarVital, type Vitales } from "@/lib/clinical/vitals-alerts"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEncounterVersion } from "./use-encounter-version"

const FIELDS: { key: keyof Vitales; label: string; unit: string }[] = [
  { key: "taSistolica", label: "TA Sistólica", unit: "mmHg" },
  { key: "taDiastolica", label: "TA Diastólica", unit: "mmHg" },
  { key: "fc", label: "FC", unit: "lpm" },
  { key: "fr", label: "FR", unit: "rpm" },
  { key: "temperatura", label: "Temperatura", unit: "°C" },
  { key: "peso", label: "Peso", unit: "kg" },
  { key: "talla", label: "Talla", unit: "cm" },
  { key: "spo2", label: "SpO2", unit: "%" },
  { key: "glasgow", label: "Glasgow", unit: "pts" },
]

interface Props {
  encounterId: string
  disabled?: boolean
  initialVitales?: Vitales
  /** Audit S9 (2026-07-07): initial version from parent encounter query. */
  initialVersion?: number
}

export function VitalsForm({
  encounterId,
  disabled,
  initialVitales,
  initialVersion,
}: Props) {
  const [v, setV] = useState<Vitales>(initialVitales ?? {})
  const { version, registerVersion, conflictDetected, ackConflict, handleTrpcError } =
    useEncounterVersion({ initialVersion })
  const utils = trpc.useUtils()
  const refetch = () => utils.encounter.get.invalidate({ id: encounterId })

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return JSON.stringify(v) !== JSON.stringify(initialVitales ?? {})
  }, [v, initialVitales])

  useEffect(() => {
    setDirty("vitals", isDirty)
  }, [isDirty, setDirty])

  // tsc TS2589 workaround: avoid inferring useMutation callbacks deeply; the
  // tRPC + Prisma + Encounter row types form a recursive union that TS chokes on
  // after we added the `version` field. Casting through `any` here is safe —
  // every shape we touch is also `any`-typed downstream.
  const save = (trpc.encounter.saveVitals.useMutation as any)({
    onSuccess: (data: { version?: number }) => {
      if (typeof data.version === "number") registerVersion(data.version)
    },
    onError: (err: unknown) => {
      if (handleTrpcError(err)) void refetch()
    },
  })
  const imc = v.peso && v.talla ? calcularImc(v.peso, v.talla) : null

  return (
    <div className="space-y-4">
      {conflictDetected && (
        <div className="rounded-md border border-amber-700 bg-amber-950/40 p-2 text-xs text-amber-200" role="alert">
          Otro doctor modificó esta consulta. Recarga para ver los datos actuales.
          <button type="button" className="ml-2 underline" onClick={ackConflict}>OK</button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map((f) => {
          const level = evaluarVital(f.key, v[f.key])
          return (
            <label key={f.key} className="block text-sm">
              <span className="mb-1 flex items-center gap-2 text-slate-300">
                {f.label}
                {level === "red" && (
                  <span className="rounded bg-red-900/50 px-1.5 text-xs font-medium text-red-400">
                    Fuera de rango
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  step="0.1"
                  disabled={disabled}
                  className={`bg-slate-800 border-slate-700 text-white ${level === "red" ? "border-red-500" : ""}`}
                  value={v[f.key] ?? ""}
                  onChange={(e) =>
                    setV((prev) => ({
                      ...prev,
                      [f.key]: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                />
                <span className="text-xs text-slate-500 whitespace-nowrap">{f.unit}</span>
              </div>
            </label>
          )
        })}
      </div>

      {imc !== null && (
        <p className="text-sm text-slate-300 flex items-center gap-2">
          IMC: <strong className="text-white">{imc}</strong>{" "}
          <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${
            clasificarImc(imc) === "Normal"
              ? "bg-emerald-900/40 text-emerald-300 border-emerald-800"
              : clasificarImc(imc) === "Bajo peso"
              ? "bg-amber-900/40 text-amber-300 border-amber-800"
              : clasificarImc(imc) === "Sobrepeso"
              ? "bg-orange-900/40 text-orange-300 border-orange-800"
              : "bg-red-900/40 text-red-300 border-red-800"
          }`}>
            {clasificarImc(imc)}
          </span>
        </p>
      )}

      {!disabled && (
        <Button
          size="sm"
          disabled={save.isPending}
          onClick={() =>
            save.mutate({
              id: encounterId,
              vitales: v,
              // audit S9: send version to enable optimistic locking.
              ...(version !== undefined ? { version } : {}),
            })
          }
          className="bg-blue-600 hover:bg-blue-700"
        >
          {save.isPending ? "Guardando..." : "Guardar signos vitales"}
        </Button>
      )}
    </div>
  )
}

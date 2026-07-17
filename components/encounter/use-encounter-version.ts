"use client"

/**
 * useEncounterSave — shared optimistic-locking save hook (audit S9, 2026-07-07).
 *
 * Centralizes the pattern used by 5 forms (historiaClinica, examen-fisico, plan,
 * plan-form-integrado, vitals) so they all consistently:
 *   - Track the encounter's current `version` (read from the parent query)
 *   - Send `version` with each save so the router can detect concurrent edits
 *   - On CONFLICT (TRPCError code), show a toast + bump a counter so the
 *     parent component can decide whether to refetch + re-apply
 *
 * **Usage:**
 * ```tsx
 * const { version, registerVersion } = useEncounterVersion({ encounterId })
 *
 * useEffect(() => {
 *   if (enc?.version !== undefined) registerVersion(enc.version)
 * }, [enc?.version])
 *
 * const save = trpc.encounter.update.useMutation({
 *   onError: (err) => {
 *     if (err.data?.code === "CONFLICT") {
 *       // surface to user; refetch on parent
 *     }
 *   },
 * })
 * ```
 *
 * The hook is intentionally minimal — it just exposes the version field and
 * a setter. Forms keep their own state for the text/vitals being edited.
 * Refetch on CONFLICT is the parent's responsibility (most forms use the
 * parent `encounter.get.useQuery` refetch trigger).
 */

import { useState, useRef, useCallback } from "react"

export interface UseEncounterVersionOptions {
  /**
   * Initial version, if known. Typically the version from the parent query
   * (`enc.version` on `encounter.get`). Pass `undefined` to start unknown
   * — useful if the form is rendered before the query resolves.
   */
  initialVersion?: number
  /** Called whenever a CONFLICT is detected, so the parent can refetch. */
  onConflict?: (info: { expectedVersion: number; currentVersion: number }) => void
}

export interface UseEncounterVersionReturn {
  /** The version we'll send on the next save. Read at call time. */
  version: number | undefined
  /** Update the version (typically after a successful save or a refetch). */
  registerVersion: (next: number | undefined) => void
  /** True if a CONFLICT was last observed; use to show a banner. */
  conflictDetected: boolean
  /** Acknowledge the conflict (hides banner). Parent should refetch by then. */
  ackConflict: () => void
  /**
   * Inspect a TRPCError and react. Call from `useMutation.onError`.
   * Returns `true` if it was a CONFLICT (caller can skip generic handling).
   */
  handleTrpcError: (err: unknown) => boolean
}

export function useEncounterVersion(
  opts: UseEncounterVersionOptions = {},
): UseEncounterVersionReturn {
  const [version, setVersion] = useState<number | undefined>(opts.initialVersion)
  const [conflictDetected, setConflictDetected] = useState(false)
  const onConflictRef = useRef(opts.onConflict)
  onConflictRef.current = opts.onConflict

  const registerVersion = useCallback((next: number | undefined) => {
    setVersion(next)
  }, [])

  const ackConflict = useCallback(() => setConflictDetected(false), [])

  const handleTrpcError = useCallback(
    (err: unknown): boolean => {
      // tRPC errors expose `.data.code` after serialization to JSON;
      // for client-side catches we look at `.data.code` first, falling
      // back to the message. Both are stable across tRPC v11.
      const e = err as { data?: { code?: string; cause?: unknown }; message?: string }
      const code = e?.data?.code
      const isConflict =
        code === "CONFLICT" ||
        (typeof e?.message === "string" && e.message.toLowerCase().includes("conflicto"))
      if (!isConflict) return false
      // Surface so the form can show a banner.
      setConflictDetected(true)
      // Pull the structured cause if available.
      const cause = (e?.data?.cause ?? {}) as {
        expectedVersion?: number
        currentVersion?: number
      }
      if (
        typeof cause.expectedVersion === "number" &&
        typeof cause.currentVersion === "number"
      ) {
        onConflictRef.current?.({
          expectedVersion: cause.expectedVersion,
          currentVersion: cause.currentVersion,
        })
      } else {
        onConflictRef.current?.({
          expectedVersion: version ?? -1,
          currentVersion: -1,
        })
      }
      return true
    },
    [version],
  )

  return { version, registerVersion, conflictDetected, ackConflict, handleTrpcError }
}

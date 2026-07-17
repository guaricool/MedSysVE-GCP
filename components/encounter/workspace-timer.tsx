"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react"

/**
 * Workspace timer — shows elapsed time since encounter started.
 * Pulses yellow at 15min, red at 20min (configurable per workspace).
 *
 * Why: makes the doctor aware of time without being intrusive.
 * In a typical 15-20 min consultation, this is a soft nudge to wrap up.
 *
 * When `stopped` is true (consultation signed/amended) the timer freezes and
 * shows a "finalizado" indicator. This prevents the counter from ticking up
 * forever once the encounter is closed.
 */
export function WorkspaceTimer({
  startedAt,
  stopped = false,
}: {
  startedAt: Date
  /** When true, freezes the timer and shows a "finalizado" badge. */
  stopped?: boolean
}) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startedAt.getTime())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Don't tick when the consultation is signed.
    if (stopped) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Freeze the value at the moment the consultation was closed
      // (or, if we don't know the close time, at "now" once).
      setElapsed((prev) => prev)
      return
    }

    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startedAt.getTime())
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [startedAt, stopped])

  const seconds = Math.floor(elapsed / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  const formatted = `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`

  if (stopped) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-md border border-emerald-800/60 bg-emerald-950/30 px-2 py-1 font-mono text-sm text-emerald-300"
        title="Consulta firmada — tiempo congelado"
      >
        <CheckCircle2 size={12} />
        <span>{formatted}</span>
        <span className="font-sans text-[10px] uppercase tracking-wider text-emerald-400/80">
          OK
        </span>
      </div>
    )
  }

  const warning = minutes >= 20
  const caution = minutes >= 15 && minutes < 20

  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-sm ${
        warning
          ? "border-red-700 bg-red-950/40 text-red-300"
          : caution
            ? "border-amber-700 bg-amber-950/40 text-amber-300"
            : "border-slate-700 bg-slate-800/50 text-slate-300"
      }`}
      title={
        warning
          ? "Consulta larga. Considere finalizar."
          : caution
            ? "15 minutos — buen momento para empezar a cerrar."
            : "Tiempo de consulta"
      }
    >
      {warning ? (
        <AlertTriangle size={12} />
      ) : (
        <Clock size={12} />
      )}
      <span>{formatted}</span>
    </div>
  )
}
"use client"
import { useEffect, useRef, useCallback, useState } from "react"
import { signOut } from "next-auth/react"

const INACTIVITY_MS = 30 * 60 * 1000   // 30 min until logout
const WARNING_TRIGGER = 25 * 60 * 1000  // show warning at 25 min
const WARNING_SECS = 5 * 60             // 5 min countdown

export function InactivityGuard() {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(WARNING_SECS)
  const logoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const warnRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const doLogout = useCallback(() => {
    signOut({ callbackUrl: "/login" })
  }, [])

  const clearAll = useCallback(() => {
    clearTimeout(logoutRef.current)
    clearTimeout(warnRef.current)
    clearInterval(tickRef.current)
  }, [])

  const reset = useCallback(() => {
    clearAll()
    setShowWarning(false)
    setCountdown(WARNING_SECS)

    warnRef.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(WARNING_SECS)
      tickRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(tickRef.current); return 0 }
          return c - 1
        })
      }, 1000)
    }, WARNING_TRIGGER)

    logoutRef.current = setTimeout(doLogout, INACTIVITY_MS)
  }, [clearAll, doLogout])

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"]
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      clearAll()
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [reset, clearAll])

  if (!showWarning) return null

  const mins = Math.floor(countdown / 60)
  const secs = String(countdown % 60).padStart(2, "0")

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <p className="text-amber-400 text-4xl text-center mb-3">&#9888;</p>
        <h2 className="text-white text-lg font-semibold text-center mb-2">Sesión por vencer</h2>
        <p className="text-slate-400 text-sm text-center mb-5">
          Su sesión cerrará en{" "}
          <span className="text-white font-bold tabular-nums">
            {mins}:{secs}
          </span>{" "}
          por inactividad.
        </p>
        <div className="flex gap-3">
          <button
            onClick={doLogout}
            className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
          >
            Cerrar sesión
          </button>
          <button
            onClick={reset}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            Continuar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

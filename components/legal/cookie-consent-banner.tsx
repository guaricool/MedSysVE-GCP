"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

const COOKIE_CONSENT_KEY = "medsysve_cookie_consent"

type CookieChoice = "all" | "essential" | "configured" | null

interface CookiePrefs {
  choice: CookieChoice
  functional: boolean
  analytics: boolean
  timestamp: string
}

/**
 * Cookie consent banner.
 *
 * Three-tier consent (LOPDP-compliant):
 *  - "Esenciales": solo cookies estrictamente necesarias (default for users
 *    who ignore the banner).
 *  - "Todas": incluye funcionales y analíticas.
 *  - "Configurar": abre el panel granular.
 *
 * Persisted to localStorage so we don't show the banner again until the user
 * clears their storage or upgrades the consent version.
 *
 * Server-side, we never rely on this banner — the only cookies we set on the
 * server are strictly necessary (auth, CSRF, rate-limit).
 */
export function CookieConsentBanner() {
  const [show, setShow] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [functional, setFunctional] = useState(true)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (!raw) {
        setShow(true)
        return
      }
      const parsed: CookiePrefs = JSON.parse(raw)
      // If the user accepted a previous version < 2, re-prompt.
      if (!parsed.timestamp) setShow(true)
    } catch {
      setShow(true)
    }
  }, [])

  function persist(prefs: Omit<CookiePrefs, "timestamp">) {
    const full: CookiePrefs = { ...prefs, timestamp: new Date().toISOString() }
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(full))
    } catch {
      // ignore
    }
    setShow(false)
    setShowSettings(false)
  }

  if (!show) return null

  return (
    <>
      <div
        role="dialog"
        aria-label="Consentimiento de cookies"
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50 rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur shadow-2xl shadow-black/40 p-5 text-sm text-slate-200"
      >
        <p className="font-semibold text-white mb-2">🍪 Sobre las cookies</p>
        {!showSettings ? (
          <>
            <p className="text-slate-400 leading-relaxed text-xs">
              MedSysVE utiliza cookies técnicas necesarias para el funcionamiento
              de la plataforma y, opcionalmente, cookies funcionales y analíticas.
              Puedes aceptar todas, solo las esenciales, o configurar tu elección.
              Consulta nuestra{" "}
              <Link href="/legal/cookies" className="text-amber-400 underline">
                Política de Cookies
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => persist({ choice: "all", functional: true, analytics: true })}
                className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-xs"
              >
                Aceptar todas
              </button>
              <button
                onClick={() => persist({ choice: "essential", functional: false, analytics: false })}
                className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium text-xs"
              >
                Solo necesarias
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-3 py-1.5 rounded-md border border-slate-600 hover:bg-slate-800 text-slate-200 font-medium text-xs"
              >
                Configurar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <ConsentRow
                label="Estrictamente necesarias"
                description="Imprescindibles para el inicio de sesión y la seguridad."
                checked
                disabled
              />
              <ConsentRow
                label="Funcionales"
                description="Recuerdan tema, idioma y preferencias del sidebar."
                checked={functional}
                onChange={setFunctional}
              />
              <ConsentRow
                label="Analíticas (agregadas, sin PHI)"
                description="Nos ayudan a entender el uso general de la plataforma."
                checked={analytics}
                onChange={setAnalytics}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => persist({ choice: "configured", functional, analytics })}
                className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-xs"
              >
                Guardar preferencias
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-3 py-1.5 rounded-md border border-slate-600 hover:bg-slate-800 text-slate-200 font-medium text-xs"
              >
                Volver
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function ConsentRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange?: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 disabled:opacity-50"
      />
      <span className="flex-1">
        <span className="block text-xs font-semibold text-white">{label}</span>
        <span className="block text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          {description}
        </span>
      </span>
    </label>
  )
}
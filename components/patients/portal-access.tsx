"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"

interface PortalAccessProps {
  patientId: string
  hasAccess: boolean
  patientEmail?: string | null
}

export function PortalAccess({ patientId, hasAccess, patientEmail }: PortalAccessProps) {
  const [password, setPassword] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)
  const [copied, setCopied] = useState<"password" | "creds" | null>(null)
  const [emailResent, setEmailResent] = useState(false)
  const [emailResendError, setEmailResendError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(!hasAccess)
  const [reminderSent, setReminderSent] = useState(false)

  const setPortalPwd = trpc.patient.setPortalPassword.useMutation({
    onSuccess: (data) => {
      setPassword(data.password)
      setGeneratedAt(new Date())
      setEmailResent(false)
      setEmailResendError(null)
    },
  })

  // Re-send the welcome email. Internally this rotates the password
  // (bcrypt is one-way — we cannot recover the previous plaintext) and
  // emails the new one. The doctor can then forward it out-of-band if
  // the patient's email keeps bouncing.
  const resendEmail = trpc.patient.resendPortalWelcome.useMutation({
    onSuccess: (data) => {
      setPassword(data.password)
      setGeneratedAt(new Date())
      setEmailResent(true)
      setEmailResendError(null)
    },
    onError: (e) => {
      setEmailResent(false)
      setEmailResendError(e.message)
    },
  })

  const sendReminder = trpc.patient.sendPortalReminder.useMutation({
    onSuccess: () => {
      setReminderSent(true)
    },
  })

  if (password) {
    const portalUrl = "https://www.medsysve.com/portal/login"
    const credsText = patientEmail
      ? `Correo: ${patientEmail}\nContraseña: ${password}\nPortal: ${portalUrl}`
      : `Contraseña: ${password}\nPortal: ${portalUrl}`

    return (
      <div className="rounded-md border border-emerald-800 bg-emerald-950/40 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-emerald-300 font-medium">
            {hasAccess ? "Contraseña regenerada" : "Acceso portal activado"}
          </p>
          {generatedAt && (
            <p className="text-[10px] text-slate-500 shrink-0">
              {generatedAt.toLocaleString("es-VE", {
                timeZone: "America/Caracas",
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Comparta estas credenciales con el paciente:
        </p>
        <div className="rounded bg-slate-950 p-3 space-y-1.5">
          {patientEmail && (
            <p className="text-sm text-slate-300 break-all">
              <span className="text-slate-500">Correo: </span>
              {patientEmail}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Contraseña: </span>
              <span className="font-mono font-bold text-white select-all">{password}</span>
            </p>
            <button
              className="text-xs text-blue-400 hover:underline"
              onClick={() => {
                navigator.clipboard.writeText(password)
                setCopied("password")
                setTimeout(() => setCopied(null), 2000)
              }}
            >
              {copied === "password" ? "Copiado ✓" : "Copiar"}
            </button>
          </div>
        </div>
        {patientEmail && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              className="text-xs text-blue-400 hover:underline"
              onClick={() => {
                navigator.clipboard.writeText(credsText)
                setCopied("creds")
                setTimeout(() => setCopied(null), 2000)
              }}
            >
              {copied === "creds" ? "Credenciales copiadas ✓" : "Copiar correo + contraseña"}
            </button>
            <span className="text-slate-700">·</span>
            <button
              disabled={resendEmail.isPending}
              onClick={() => resendEmail.mutate({ patientId })}
              className="text-xs text-blue-400 hover:underline disabled:opacity-50"
            >
              {resendEmail.isPending
                ? "Reenviando..."
                : "Reenviar email al paciente"}
            </button>
            {emailResent && (
              <span className="text-xs text-emerald-400">Email reenviado ✓</span>
            )}
            {emailResendError && (
              <span className="text-xs text-red-400">{emailResendError}</span>
            )}
          </div>
        )}
        <p className="text-xs text-slate-500">
          Esta contraseña no se volverá a mostrar. Guárdela ahora.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${hasAccess ? "bg-emerald-400" : "bg-slate-600"}`}
          />
          <span className="text-sm text-slate-300">
            Portal {hasAccess ? "activo" : "inactivo"}
          </span>
        </div>
        {!patientEmail && !hasAccess && (
          <p className="text-xs text-amber-400">
            El paciente necesita un correo registrado para recibir las credenciales.
          </p>
        )}
      </div>

      {hasAccess && (
        <div className="rounded-md border border-slate-800 bg-slate-900/50 p-3">
          <p className="text-sm text-emerald-300 font-medium mb-1">El paciente ya posee una cuenta activa.</p>
          <p className="text-xs text-slate-400 mb-3">Puede iniciar sesión con su correo electrónico y la contraseña que ya utilizaba.</p>
          <div className="flex items-center gap-3">
            <button
              disabled={sendReminder.isPending || !patientEmail}
              onClick={() => sendReminder.mutate({ patientId })}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              {sendReminder.isPending ? "Enviando..." : "Enviar recordatorio por correo"}
            </button>
            {reminderSent && <span className="text-xs text-emerald-400">Recordatorio enviado ✓</span>}
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mt-3 text-[10px] text-slate-500 hover:text-slate-300 underline"
          >
            {showAdvanced ? "Ocultar opciones avanzadas" : "Mostrar opciones avanzadas (Regenerar contraseña)"}
          </button>
        </div>
      )}

      {showAdvanced && (
        <div className="flex items-center gap-4 mt-2">
          <button
            disabled={setPortalPwd.isPending}
            onClick={() => {
              if (hasAccess && !confirm("¿Está seguro? Esto borrará la contraseña actual del paciente para TODOS los doctores. Solo hágalo si el paciente olvidó su clave.")) {
                return
              }
              setPortalPwd.mutate({ patientId })
            }}
            className={`rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 ${
              hasAccess 
                ? "border-amber-900/50 text-amber-400 hover:bg-amber-950/30" 
                : "border-slate-700 text-slate-300 hover:border-blue-500 hover:text-white"
            }`}
          >
            {setPortalPwd.isPending
              ? "Procesando..."
              : hasAccess
                ? "⚠ Forzar regeneración de contraseña"
                : "Activar acceso portal"}
          </button>
          {setPortalPwd.error && (
            <p className="text-xs text-red-400">{setPortalPwd.error.message}</p>
          )}
        </div>
      )}
    </div>
  )
}

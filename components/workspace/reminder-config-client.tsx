"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Bell, CheckCircle } from "lucide-react"

interface Props {
  initialHoras: number
  initialWa: boolean
  initialEmail: boolean
}

export function ReminderConfigClient({ initialHoras, initialWa, initialEmail }: Props) {
  const [horas, setHoras] = useState(initialHoras)
  const [wa, setWa] = useState(initialWa)
  const [email, setEmail] = useState(initialEmail)
  const [saved, setSaved] = useState(false)

  const update = (trpc.workspace as any).updateReminderConfig.useMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: any) => alert(e.message),
  })

  const HORA_OPTIONS = [1, 2, 4, 6, 12, 24, 48, 72]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-white">Configuración de Recordatorios</h2>
      </div>
      <p className="text-xs text-slate-400">
        Define cuándo y cómo enviar recordatorios automáticos de citas a los pacientes.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Enviar recordatorio con cuánto tiempo de anticipación
          </label>
          <select
            value={horas}
            onChange={(e) => { setHoras(Number(e.target.value)); setSaved(false) }}
            className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white"
          >
            {HORA_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h < 24 ? `${h} hora${h > 1 ? "s" : ""}` : `${h / 24} día${h > 24 ? "s" : ""}`}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-400">Canales de envío</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={email}
                onChange={(e) => { setEmail(e.target.checked); setSaved(false) }}
                className="sr-only"
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${email ? "bg-blue-600" : "bg-slate-700"}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${email ? "translate-x-5" : ""}`} />
            </div>
            <span className="text-sm text-slate-300">Email</span>
          </label>
{/* WhatsApp temporalmente desactivado
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={wa}
                onChange={(e) => { setWa(e.target.checked); setSaved(false) }}
                className="sr-only"
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${wa ? "bg-green-600" : "bg-slate-700"}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${wa ? "translate-x-5" : ""}`} />
            </div>
            <span className="text-sm text-slate-300">
              WhatsApp
              {!process.env.NEXT_PUBLIC_WA_ENABLED && (
                <span className="ml-2 text-xs text-amber-400">(requiere configuración)</span>
              )}
            </span>
          </label>
          */}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => update.mutate({ recordatorioHoras: horas, recordatorioWa: wa, recordatorioEmail: email })}
            disabled={update.isPending}
            className="rounded bg-blue-700 px-4 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {update.isPending ? "Guardando..." : "Guardar configuración"}
          </button>
          {saved && (
            <p className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" />
              Guardado
            </p>
          )}
        </div>

        <div className="rounded-md border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-500">
          <p className="font-medium text-slate-400 mb-1">¿Cómo funciona?</p>
          <p>
            El CRON job de recordatorios (<code className="text-slate-300">/api/cron/reminders</code>)
            se ejecuta periódicamente y envía recordatorios a los pacientes con citas confirmadas
            que estén a {horas < 24 ? `${horas}h` : `${horas / 24}d`} de distancia.
          </p>
        </div>
      </div>
    </div>
  )
}

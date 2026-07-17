"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Settings, ShieldCheck, CheckCircle } from "lucide-react"

interface Props {
  initialAutoCreate: boolean
  initialEmailReminders: boolean
  initialAllowedIps: string | null
}

export function ClinicWorkflowSettings({ initialAutoCreate, initialEmailReminders, initialAllowedIps }: Props) {
  const [autoCreate, setAutoCreate] = useState(initialAutoCreate)
  const [emailReminders, setEmailReminders] = useState(initialEmailReminders)
  const [allowedIps, setAllowedIps] = useState(initialAllowedIps ?? "")
  const [saved, setSaved] = useState(false)

  const update = trpc.workspace.updateSettings.useMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: any) => alert(e.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-white">Configuración del Flujo Clínico y Seguridad</h2>
      </div>
      <p className="text-xs text-slate-400">
        Personaliza el comportamiento automatizado de la consulta y las restricciones de seguridad.
      </p>

      <div className="space-y-4">
        {/* Toggles */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={autoCreate}
                onChange={(e) => { setAutoCreate(e.target.checked); setSaved(false) }}
                className="sr-only"
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${autoCreate ? "bg-blue-600" : "bg-slate-700"}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoCreate ? "translate-x-5" : ""}`} />
            </div>
            <div>
              <span className="text-sm text-slate-300 block">Iniciar Consulta Automáticamente</span>
              <span className="text-xs text-slate-500">
                Crea el borrador clínico al cambiar el estado del paciente a "En consulta" en la sala de espera.
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={emailReminders}
                onChange={(e) => { setEmailReminders(e.target.checked); setSaved(false) }}
                className="sr-only"
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${emailReminders ? "bg-blue-600" : "bg-slate-700"}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${emailReminders ? "translate-x-5" : ""}`} />
            </div>
            <div>
              <span className="text-sm text-slate-300 block">Recordatorios automáticos por Email</span>
              <span className="text-xs text-slate-500">
                Permitir envíos de correos de confirmación y aviso a los pacientes.
              </span>
            </div>
          </label>
        </div>

        {/* IP Restriction */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Restricción de IPs para Asistentes y Personal (Staff)
          </label>
          <p className="text-xs text-slate-500">
            Especifica las IPs públicas permitidas separadas por comas (ej. 200.12.34.56). Si se deja vacío, no habrá restricción. El personal no médico será bloqueado fuera de estas IPs.
          </p>
          <input
            type="text"
            value={allowedIps}
            onChange={(e) => { setAllowedIps(e.target.value); setSaved(false) }}
            placeholder="Ej: 200.12.34.56, 190.45.67.89"
            className="w-full max-w-lg rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => update.mutate({
              autoCreateHistoryOnEncounter: autoCreate,
              emailAppointmentReminders: emailReminders,
              allowedIps: allowedIps.trim() || null,
            })}
            disabled={update.isPending}
            className="rounded bg-blue-700 px-4 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {update.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
          {saved && (
            <p className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" />
              Guardado
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

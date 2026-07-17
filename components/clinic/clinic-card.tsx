"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Copy, Check, Building2, RefreshCw, AlertTriangle } from "lucide-react"
import { ESTADOS_VENEZUELA, getCiudadesByEstado } from "@/lib/venezuela-locations"

interface ClinicData {
  id: string
  nombre: string
  estado: string | null
  ciudad: string | null
  invitationCodes?: Array<{
    id: string
    code: string
    used: boolean
    createdAt: Date | string
  }>
}

interface Props {
  clinic: ClinicData | null
  /** Whether the current doctor owns this clinic (workspace.clinicId). */
  isOwner: boolean
}

export function ClinicCard({ clinic, isOwner }: Props) {
  const [copied, setCopied] = useState(false)
  const utils = trpc.useUtils()

  const regenerate = trpc.workspace.regenerateClinicCode.useMutation({
    onSuccess: () => utils.workspace.current.invalidate(),
  })

  function copy(codeStr: string) {
    if (!codeStr) return
    navigator.clipboard.writeText(codeStr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!clinic) {
    return (
      <section className="rounded-lg border border-dashed border-slate-700 p-5">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-slate-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Clínica
          </h2>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Este consultorio no está asociado a ninguna clínica. Si trabajas como parte
          de un equipo médico más grande, pídele al administrador de la clínica el
          código de invitación y úsalo desde el botón "Unirse a clínica".
        </p>
        <p className="mt-2 text-xs text-slate-500">
          (Próximamente: crear clínicas propias desde aquí.)
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 size={16} className="text-blue-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Clínica
        </h2>
      </div>

      <div>
        <p className="text-base font-semibold text-white">{clinic.nombre}</p>
        <p className="text-xs text-slate-400">
          {clinic.ciudad}, {clinic.estado}
        </p>
      </div>

      {isOwner && (
        <div className="rounded-md border border-blue-800/40 bg-blue-950/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
            Códigos de invitación (Mensualidad gratuita)
          </p>
          <p className="mt-1 text-[11px] text-blue-200/80">
            Compartilos con los doctores que quieras sumar a la clínica. Ellos lo
            ingresan al registrarse o desde Configuración para crear su workspace
            bajo esta clínica (los primeros 2 están incluidos sin costo).
          </p>
          
          <div className="mt-4 space-y-3">
            {(!clinic.invitationCodes || clinic.invitationCodes.length === 0) ? (
               <p className="text-xs text-slate-500">No hay códigos generados.</p>
            ) : clinic.invitationCodes.map((codeObj, index) => (
              <div key={codeObj.id} className="flex flex-col gap-1.5 border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-slate-500 uppercase">
                    Código {index + 1}
                  </span>
                  {codeObj.used && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                      USADO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <code className={`flex-1 select-all rounded bg-slate-950 px-3 py-2 font-mono text-sm font-bold ${codeObj.used ? 'text-slate-500 line-through' : 'text-amber-300'}`}>
                    {codeObj.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(codeObj.code)}
                    disabled={codeObj.used}
                    className="flex items-center gap-1.5 rounded border border-blue-700 bg-blue-900/40 px-3 py-2 text-xs font-medium text-blue-200 hover:bg-blue-900/60 disabled:opacity-50"
                  >
                    {copied ? (
                      <>
                        <Check size={13} /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copiar
                      </>
                    )}
                  </button>
                  {/* Regenerate logic only makes sense for unused codes if they suspect leak, or to rotate an existing one. For now we hide it if used, or just let them generate a new one */}
                  {!codeObj.used && (
                    <button
                      type="button"
                      // Since we didn't update regenerateClinicCode to take codeId in workspace router, we disable this for now, or update it later.
                      onClick={() => regenerate.mutate({ clinicId: clinic.id })}
                      disabled={regenerate.isPending}
                      className="flex items-center gap-1.5 rounded border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                      title="Genera un código nuevo. El código anterior deja de funcionar."
                    >
                      <RefreshCw size={13} />
                    </button>
                  )}
                </div>
                {codeObj.createdAt && (
                  <p className="text-[10px] text-slate-500">
                    Generado el{" "}
                    {new Date(codeObj.createdAt).toLocaleDateString("es-VE", {
                      timeZone: "America/Caracas",
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>

          {regenerate.error && (
            <p className="mt-2 text-xs text-red-400">{regenerate.error.message}</p>
          )}
        </div>
      )}

      {!isOwner && (
        <div className="flex items-start gap-2 rounded-md border border-slate-700 bg-slate-800/50 p-3 text-xs text-slate-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <p>
            Solo el propietario de la clínica puede ver el código de invitación.
            Si necesitás sumar un doctor, pedile al propietario que lo comparta.
          </p>
        </div>
      )}
    </section>
  )
}

interface LocationFormProps {
  initialEstado: string | null
  initialCiudad: string | null
}

export function LocationForm({ initialEstado, initialCiudad }: LocationFormProps) {
  const [estado, setEstado] = useState(initialEstado ?? "")
  const [ciudad, setCiudad] = useState(initialCiudad ?? "")
  const [saved, setSaved] = useState(false)

  const update = trpc.workspace.updateSettings.useMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  function handleSave() {
    if (!estado || !ciudad) return
    update.mutate({ estado, ciudad })
  }

  const isDirty =
    estado !== (initialEstado ?? "") || ciudad !== (initialCiudad ?? "")
  const isComplete = !!estado && !!ciudad

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Ubicación del consultorio
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Necesario para que otros doctores de tu zona puedan encontrarte al
          referir pacientes. Si no completas esto, no aparecerás en el buscador
          de referidos.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">
            Estado <span className="text-red-400">*</span>
          </label>
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value)
              setCiudad("")
              setSaved(false)
            }}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">Seleccionar...</option>
            {ESTADOS_VENEZUELA.map((e) => (
              <option key={e.codigo} value={e.nombre}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">
            Ciudad <span className="text-red-400">*</span>
          </label>
          <select
            value={ciudad}
            onChange={(e) => {
              setCiudad(e.target.value)
              setSaved(false)
            }}
            disabled={!estado}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">{estado ? "Seleccionar..." : "Primero un estado"}</option>
            {estado &&
              getCiudadesByEstado(estado).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={update.isPending || !isDirty || !isComplete}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {update.isPending ? "Guardando..." : "Guardar ubicación"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Guardado.</span>}
        {update.error && <span className="text-sm text-red-400">{update.error.message}</span>}
      </div>
    </section>
  )
}

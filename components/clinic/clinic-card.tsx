"use client"

import { Building2 } from "lucide-react"
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

export function ClinicCard({ clinic }: Props) {
  if (!clinic) return null

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Building2 size={16} className="text-blue-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Clínica Asociada
        </h2>
      </div>

      <div>
        <p className="text-base font-semibold text-white">{clinic.nombre}</p>
        <p className="text-xs text-slate-400">
          {clinic.ciudad}, {clinic.estado}
        </p>
      </div>
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

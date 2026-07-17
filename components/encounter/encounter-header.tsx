"use client"

interface EncounterHeaderProps {
  nombre: string
  edad: number | string
  idDisplay: string
  medsActivasCount?: number
  grupoSanguineo?: string
}

export function EncounterHeader({
  nombre,
  edad,
  idDisplay,
  medsActivasCount = 0,
  grupoSanguineo,
}: EncounterHeaderProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <span className="text-lg font-semibold text-white">{nombre}</span>
          <span className="ml-2 text-slate-400 text-sm">{edad} años</span>
        </div>
        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-blue-400">
          #{idDisplay}
        </span>
        {grupoSanguineo && (
          <span className="rounded bg-red-900/40 px-2 py-0.5 text-xs text-red-300 font-semibold">
            🩸 {grupoSanguineo}
          </span>
        )}
        {medsActivasCount > 0 && (
          <span className="rounded bg-blue-900/40 px-2 py-0.5 text-xs text-blue-300">
            {medsActivasCount} medicamento{medsActivasCount !== 1 ? "s" : ""} en receta
          </span>
        )}
      </div>
    </div>
  )
}

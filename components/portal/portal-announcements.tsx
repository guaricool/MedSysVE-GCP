"use client"

import { trpc } from "@/lib/trpc-client"

export function PortalAnnouncements() {
  const { data: rawAnns = [] } = (trpc as any).portal.getAnnouncements.useQuery()
  const anns = rawAnns as any[]

  if (anns.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-white">Anuncios</h2>
      <div className="space-y-3">
        {anns.map((a: any) => (
          <div
            key={a.id}
            className="rounded-lg border border-blue-900/50 bg-blue-950/20 p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="font-semibold text-white text-sm">{a.titulo}</p>
              <span className="text-xs text-slate-500 shrink-0">{a.workspaceNombre}</span>
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-line">{a.mensaje}</p>
            <p className="text-xs text-slate-600 mt-2">
              {new Date(a.creadoAt).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

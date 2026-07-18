"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { ChevronDown, Building2, PlusCircle } from "lucide-react"
import Link from "next/link"
import type { SessionUser } from "@/types"

export function WorkspaceSwitcher() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: workspaces = [] } = trpc.workspace.myWorkspaces.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  // Removed early return so the switcher is always visible

  const user = session?.user as SessionUser | undefined
  const currentId = user?.workspaceId
  const current = workspaces.find((w) => w.id === currentId)

  async function switchWorkspace(id: string) {
    if (id === currentId || switching) return
    setOpen(false)
    setSwitching(true)
    await update({ workspaceId: id })
    router.refresh()
    setSwitching(false)
  }

  return (
    <div ref={ref} className="relative mt-1">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={switching}
        className="flex items-center justify-between w-full rounded px-1 py-0.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        <span className="flex items-center gap-1 min-w-0">
          {current?.logoUrl ? (
            <img src={current.logoUrl} alt="" className="h-4 w-4 shrink-0 rounded object-contain bg-white" />
          ) : (
            <Building2 size={10} className="shrink-0 text-blue-400" />
          )}
          <span className="truncate">{switching ? "Cambiando..." : (current?.nombre ?? "Seleccionar")}</span>
        </span>
        <ChevronDown size={10} className="shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-md border border-slate-700 bg-slate-900 shadow-lg py-1">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => switchWorkspace(ws.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs truncate transition-colors ${
                ws.id === currentId
                  ? "text-blue-400 bg-blue-900/20 font-medium"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {ws.logoUrl ? (
                <img src={ws.logoUrl} alt="" className="h-4 w-4 shrink-0 rounded object-contain bg-white" />
              ) : (
                <Building2 size={10} className="shrink-0" />
              )}
              {ws.nombre}
            </button>
          ))}
          <div className="border-t border-slate-700 mt-1 pt-1">
            <Link
              href="/doctor/workspace"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:text-blue-400 hover:bg-slate-800 transition-colors"
            >
              <PlusCircle size={10} className="shrink-0" />
              + Añadir / Unirse a Consultorio
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

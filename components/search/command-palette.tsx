"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { trpc } from "@/lib/trpc-client"
import {
  Search, Home, Users, Calendar, ClipboardList, DollarSign,
  BarChart2, CheckSquare, HeartPulse, Settings, Share2,
  UserPlus, X, ArrowRight, User,
} from "lucide-react"

const STATIC_COMMANDS = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/doctor", group: "Navegar" },
  { id: "patients", label: "Pacientes", icon: Users, href: "/doctor/patients", group: "Navegar" },
  { id: "new-patient", label: "Nuevo paciente", icon: UserPlus, href: "/doctor/patients/new", group: "Acción" },
  { id: "appointments", label: "Citas", icon: Calendar, href: "/doctor/appointments", group: "Navegar" },
  { id: "waiting-room", label: "Sala de espera", icon: ClipboardList, href: "/doctor/waiting-room", group: "Navegar" },
  { id: "tasks", label: "Tareas del equipo", icon: CheckSquare, href: "/doctor/tasks", group: "Navegar" },
  { id: "chronics", label: "Panel de crónicos", icon: HeartPulse, href: "/doctor/chronics", group: "Navegar" },
  { id: "billing", label: "Facturación", icon: DollarSign, href: "/doctor/billing", group: "Navegar" },
  { id: "analytics", label: "Estadísticas", icon: BarChart2, href: "/doctor/analytics", group: "Navegar" },
  { id: "referrals", label: "Referidos", icon: Share2, href: "/doctor/referrals", group: "Navegar" },
  { id: "workspace", label: "Configuración del consultorio", icon: Settings, href: "/doctor/workspace", group: "Navegar" },
]

interface CommandItem {
  id: string
  label: string
  sublabel?: string
  href?: string
  onSelect?: () => void
  icon: React.ElementType
  group: string
}

export function CommandPalette() {
  const router = useRouter()
  const { data: session } = useSession()
  const currentWorkspaceId = session?.user?.workspaceId as string | undefined
  const importPatient = trpc.patient.importPatient.useMutation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { data: patients } = trpc.patient.search.useQuery(
    { query },
    { enabled: query.length >= 2, staleTime: 10000 },
  )

  const uniquePatients = Array.from(
    ((patients as any[]) ?? []).reduce((acc, p) => {
      const key = p.patient.numeroIdentificacion || (p.patient.nombre + p.patient.apellido)
      if (!acc.has(key) || p.workspaceId === currentWorkspaceId) {
        acc.set(key, p)
      }
      return acc
    }, new Map<string, any>())
  .values())

  const patientItems: CommandItem[] = uniquePatients.slice(0, 6).map((p: any) => {
    const isOtherWorkspace = p.workspaceId !== currentWorkspaceId
    return {
      id: `patient-${p.id}`,
      label: `${p.patient.nombre} ${p.patient.apellido}`,
      sublabel: `${p.idDisplay}${p.patient.numeroIdentificacion ? ` · CI: ${p.patient.numeroIdentificacion}` : ""}`,
      href: isOtherWorkspace ? undefined : `/doctor/patients/${p.id}`,
      onSelect: isOtherWorkspace ? () => {
        importPatient.mutate({ patientId: p.patientId }, {
          onSuccess: (newReg) => {
            router.push(`/doctor/patients/${newReg.id}`)
            close()
          }
        })
      } : undefined,
      icon: User,
      group: "Pacientes",
    }
  })

  const filteredCommands = query.length < 2
    ? STATIC_COMMANDS
    : STATIC_COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.group.toLowerCase().includes(query.toLowerCase()),
      )

  const allItems: CommandItem[] = [
    ...patientItems,
    ...filteredCommands,
  ]

  const open_ = useCallback(() => {
    setOpen(true)
    setQuery("")
    setSelectedIdx(0)
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setQuery("")
    setSelectedIdx(0)
  }, [])

  const navigate = useCallback(
    (href: string) => {
      router.push(href)
      close()
    },
    [router, close],
  )

  // Global keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (open) close()
        else open_()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, open_, close])

  // Arrow navigation + enter
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { close(); return }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, allItems.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter" && allItems[selectedIdx]) {
        e.preventDefault()
        const item = allItems[selectedIdx]
        if (item.onSelect) item.onSelect()
        else if (item.href) navigate(item.href)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, selectedIdx, allItems, close, navigate])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIdx])

  // Reset selection when items change
  useEffect(() => { setSelectedIdx(0) }, [query])

  if (!open) return null

  // Group items for display
  const groups: { label: string; items: CommandItem[] }[] = []
  const seen = new Set<string>()
  for (const item of allItems) {
    if (!seen.has(item.group)) {
      seen.add(item.group)
      groups.push({ label: item.group, items: [] })
    }
    groups[groups.length - 1].items.push(item)
  }

  let globalIdx = 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Panel */}
      <div className="relative w-full max-w-xl mx-4 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
          <Search size={16} className="shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar paciente, página, acción..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-600 hover:text-slate-400">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {allItems.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Sin resultados para "{query}"</p>
          )}

          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                {group.label}
              </p>
              {group.items.map((item) => {
                const idx = globalIdx++
                const isSelected = idx === selectedIdx
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    data-idx={idx}
                    onClick={() => item.onSelect ? item.onSelect() : item.href && navigate(item.href)}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? "bg-blue-600/20 text-white" : "text-slate-300 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? "bg-blue-600/30" : "bg-slate-800"
                    }`}>
                      <Icon size={14} className={isSelected ? "text-blue-400" : "text-slate-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      {item.sublabel && (
                        <p className="text-xs text-slate-500 truncate">{item.sublabel}</p>
                      )}
                    </div>
                    {isSelected && <ArrowRight size={13} className="shrink-0 text-blue-400" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-t border-slate-800 px-4 py-2 flex items-center gap-4 text-[10px] text-slate-600">
          <span><kbd className="font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono">↵</kbd> abrir</span>
          <span><kbd className="font-mono">Esc</kbd> cerrar</span>
          <span className="ml-auto">
            <kbd className="font-mono">{typeof navigator !== "undefined" && /Mac/.test(navigator.platform) ? "⌘" : "Ctrl"}+K</kbd> para abrir
          </span>
        </div>
      </div>
    </div>
  )
}

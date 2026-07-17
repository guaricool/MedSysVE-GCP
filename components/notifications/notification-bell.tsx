"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Bell, CheckCheck, Calendar, MessageSquare, Share2, Microscope, Info, UserPlus } from "lucide-react"

const TIPO_CONFIG: Record<string, { icon: React.ElementType; cls: string; border: string }> = {
  APPOINTMENT_REQUEST: { icon: Calendar, cls: "text-blue-400 bg-blue-950/50", border: "border-blue-800/40" },
  PORTAL_MESSAGE: { icon: MessageSquare, cls: "text-emerald-400 bg-emerald-950/50", border: "border-emerald-800/40" },
  // Amber + UserPlus: visually distinct from ACCEPTED/REJECTED, conveys
  // "new patient incoming, needs your attention".
  REFERRAL_RECEIVED: { icon: UserPlus, cls: "text-amber-400 bg-amber-950/50", border: "border-amber-800/40" },
  REFERRAL_ACCEPTED: { icon: Share2, cls: "text-green-400 bg-green-950/50", border: "border-green-800/40" },
  REFERRAL_REJECTED: { icon: Share2, cls: "text-red-400 bg-red-950/50", border: "border-red-800/40" },
  IMAGING_RESULT: { icon: Microscope, cls: "text-purple-400 bg-purple-950/50", border: "border-purple-800/40" },
  SYSTEM: { icon: Info, cls: "text-slate-400 bg-slate-800/50", border: "border-slate-700" },
}

/// Map notification types to their relevant in-app destination. When the
/// user clicks a notification in the dropdown we mark it read AND navigate
/// to the matching page so they can take action (accept the referral,
/// review the appointment, read the message, etc).
///
/// null = mark-read-only (no destination yet).
///
/// Audit S16 (2026-07-06): all 5 previously-TODO notification types wired.
/// IMAGING_RESULT uses /doctor/patients (list) instead of a per-record
/// deep link because the notification's referenciaId is the imagingOrder.id
/// (not the patientRegistrationId). Adding a per-record deep link would
/// require either: (a) a server-side lookup keyed off the imaging order,
/// or (b) denormalizing patientRegistrationId into referenciaId. Both are
/// tracked as follow-ups — for now the user lands on the patients list and
/// can find the imaging result through the encounter workflow.
const TIPO_HREF: Record<string, string | null> = {
  APPOINTMENT_REQUEST: "/doctor/appointments",
  PORTAL_MESSAGE: "/doctor/mensajes",
  REFERRAL_RECEIVED: "/doctor/referrals",
  REFERRAL_ACCEPTED: "/doctor/referrals",
  REFERRAL_REJECTED: "/doctor/referrals",
  IMAGING_RESULT: "/doctor/patients",
  // SYSTEM notifications have no in-app destination — mark-read-only.
  SYSTEM: null,
}

function timeAgo(date: string | Date) {
  const ms = Date.now() - new Date(date).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return "ahora"
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const utils = trpc.useUtils()

  const { data: unread } = (trpc.notification as any).unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  })
  const { data: notifications } = (trpc.notification as any).list.useQuery(undefined, {
    enabled: open,
  })

  const markRead = (trpc.notification as any).markRead.useMutation({
    onSuccess: () => {
      ;(utils.notification as any).unreadCount.invalidate()
      ;(utils.notification as any).list.invalidate()
    },
  })
  const markAllRead = (trpc.notification as any).markAllRead.useMutation({
    onSuccess: () => {
      ;(utils.notification as any).unreadCount.invalidate()
      ;(utils.notification as any).list.invalidate()
    },
  })

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const unreadCount = (unread as any)?.count ?? 0
  const list = (notifications as any[]) ?? []

  function handleNotificationClick(n: any) {
    if (!n.leida) markRead.mutate({ id: n.id })
    
    // Override href for billing reminders (which are SYSTEM notifications)
    let href = TIPO_HREF[n.tipo]
    if (n.referenciaId === "BILLING_REMINDER") {
      href = "/doctor/billing"
    }

    if (href) {
      setOpen(false)
      router.push(href)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        title="Notificaciones"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
      >
        <Bell size={16} className={unreadCount > 0 ? "animate-wiggle" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 rounded-full bg-red-600 text-white text-[9px] min-w-[14px] h-[14px] px-0.5 flex items-center justify-center font-bold ring-2 ring-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate(undefined)}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
              >
                <CheckCheck size={12} />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {list.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="mx-auto mb-2 text-slate-700" />
                <p className="text-sm text-slate-500">Sin notificaciones</p>
              </div>
            )}
            {list.map((n: any) => {
              const cfg = TIPO_CONFIG[n.tipo] ?? TIPO_CONFIG.SYSTEM
              const Icon = cfg.icon
              let href = TIPO_HREF[n.tipo]
              if (n.referenciaId === "BILLING_REMINDER") {
                href = "/doctor/billing"
              }
              return (
                <div
                  key={n.id}
                  role={href ? "button" : undefined}
                  tabIndex={href ? 0 : undefined}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => {
                    if (href && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault()
                      handleNotificationClick(n)
                    }
                  }}
                  className={`flex gap-3 px-4 py-3 border-b border-slate-800/60 transition-colors hover:bg-slate-800/30 cursor-pointer ${!n.leida ? "bg-slate-800/20" : ""}`}
                >
                  <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border ${cfg.border} ${cfg.cls}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold ${n.leida ? "text-slate-400" : "text-white"}`}>
                        {n.titulo}
                      </p>
                      {!n.leida && (
                        <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {n.mensaje}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-600">{timeAgo(n.createdAt)}</p>
                      {href && (
                        <span className="text-[10px] text-blue-400 font-medium">Atender →</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


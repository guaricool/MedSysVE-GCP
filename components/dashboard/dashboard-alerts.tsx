"use client"
import { trpc } from "@/lib/trpc-client"
import Link from "next/link"
import { Bell, Calendar, FileText, MessageSquare } from "lucide-react"

export function DashboardAlerts() {
  const { data } = (trpc.analytics as any).alerts.useQuery(undefined, { refetchInterval: 60000 })

  if (!data) return null
  const { requestedAppointments, overdueInvoices, unreadMessages } = data
  const total = requestedAppointments + overdueInvoices + unreadMessages
  if (total === 0) return null

  return (
    <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={15} className="text-amber-400" />
        <p className="text-sm font-medium text-amber-300">Pendientes de atención</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {requestedAppointments > 0 && (
          <Link
            href="/doctor/appointments"
            className="flex items-center gap-2 rounded-lg bg-blue-900/30 border border-blue-800/50 px-3 py-2 text-sm text-blue-300 hover:bg-blue-900/50 transition"
          >
            <Calendar size={14} />
            <span>
              {requestedAppointments} cita{requestedAppointments > 1 ? "s" : ""} solicitada
              {requestedAppointments > 1 ? "s" : ""}
            </span>
          </Link>
        )}
        {overdueInvoices > 0 && (
          <Link
            href="/doctor/billing"
            className="flex items-center gap-2 rounded-lg bg-red-900/30 border border-red-800/50 px-3 py-2 text-sm text-red-300 hover:bg-red-900/50 transition"
          >
            <FileText size={14} />
            <span>
              {overdueInvoices} factura{overdueInvoices > 1 ? "s" : ""} vencida
              {overdueInvoices > 1 ? "s" : ""}
            </span>
          </Link>
        )}
        {unreadMessages > 0 && (
          <Link
            href="/doctor/mensajes"
            className="flex items-center gap-2 rounded-lg bg-purple-900/30 border border-purple-800/50 px-3 py-2 text-sm text-purple-300 hover:bg-purple-900/50 transition"
          >
            <MessageSquare size={14} />
            <span>
              {unreadMessages} mensaje{unreadMessages > 1 ? "s" : ""} sin leer
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}

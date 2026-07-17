"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Users, Calendar, LogOut, Settings, Home, Stethoscope, DollarSign, BarChart2, Clock, Share2, ClipboardList, MessageSquare, HeartPulse, CheckSquare, Search, Shield, FileCheck, FileText, ShieldCheck, Upload, Award, Menu, X, Bell, ShieldAlert, Key, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { trpc } from "@/lib/trpc-client"

const doctorLinks = [
  { href: "/doctor", label: "Dashboard", icon: Home },
  { href: "/doctor/patients", label: "Pacientes", icon: Users },
  { href: "/doctor/waiting-room", label: "Sala de Espera", icon: ClipboardList },
  { href: "/doctor/appointments", label: "Citas", icon: Calendar },
  { href: "/doctor/billing", label: "Facturación", icon: DollarSign },
  { href: "/doctor/analytics", label: "Estadísticas", icon: BarChart2 },
  { href: "/doctor/schedule", label: "Horario", icon: Clock },
  { href: "/doctor/mensajes", label: "Mensajes", icon: MessageSquare },
  { href: "/doctor/chronics", label: "Crónicos", icon: HeartPulse },
  { href: "/doctor/tasks", label: "Tareas", icon: CheckSquare },
  { href: "/doctor/insurance", label: "Seguros", icon: Shield },
  { href: "/doctor/consent-templates", label: "Consentimientos", icon: FileCheck },
  { href: "/doctor/audit", label: "Auditoría", icon: ShieldCheck },
  { href: "/doctor/import", label: "Importar", icon: Upload },
  { href: "/doctor/quality", label: "Calidad", icon: Award },
  { href: "/doctor/referrals", label: "Referidos", icon: Share2 },
  { href: "/doctor/express", label: "Orden Express", icon: Zap },
  { href: "/doctor/staff", label: "Mi Equipo", icon: Users },
  { href: "/doctor/workspace", label: "Consultorio", icon: Settings },
  { href: "/doctor/preferencias-informe", label: "Informe (preferencias)", icon: FileText },
]

const secretaryLinks = [
  { href: "/secretary", label: "Dashboard", icon: Home },
  { href: "/doctor/patients", label: "Pacientes", icon: Users },
  { href: "/doctor/waiting-room", label: "Sala de Espera", icon: ClipboardList },
  { href: "/doctor/appointments", label: "Citas", icon: Calendar },
  { href: "/doctor/tasks", label: "Tareas", icon: CheckSquare },
  { href: "/doctor/billing", label: "Facturación", icon: DollarSign },
  { href: "/doctor/analytics", label: "Estadísticas", icon: BarChart2 },
]

const assistantLinks = [
  { href: "/assistant", label: "Dashboard", icon: Home },
  { href: "/doctor/patients", label: "Pacientes", icon: Users },
  { href: "/doctor/waiting-room", label: "Sala de Espera", icon: ClipboardList },
]

const nurseLinks = [
  { href: "/doctor/waiting-room", label: "Sala de Espera", icon: ClipboardList },
  { href: "/doctor/patients", label: "Pacientes", icon: Users },
  { href: "/doctor/appointments", label: "Citas", icon: Calendar },
]

const clinicAdminLinks = [
  { href: "/clinica", label: "Dashboard", icon: Home },
  { href: "/clinica/doctores", label: "Doctores", icon: Users },
  { href: "/clinica/staff", label: "Personal", icon: Users },
  { href: "/clinica/invitaciones", label: "Códigos de Invitación", icon: Key },
  { href: "/clinica/suscripcion", label: "Suscripción", icon: DollarSign },
  { href: "/clinica/audit", label: "Auditoría", icon: ShieldCheck },
  { href: "/clinica/settings", label: "Configuración", icon: Settings },
]

const roleLinks: Record<UserRole, typeof doctorLinks> = {
  DOCTOR: doctorLinks,
  SECRETARY: secretaryLinks,
  ASSISTANT: assistantLinks,
  NURSE: nurseLinks,
  PATIENT: [],
  CLINIC_ADMIN: clinicAdminLinks,
}

interface SidebarProps {
  role: UserRole
  nombre: string
  apellido: string
  workspaceNombre: string
  workspaceLogoUrl?: string | null
  isAdmin?: boolean
}

export function Sidebar({ role, nombre, apellido, workspaceNombre, workspaceLogoUrl, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const links = roleLinks[role] ?? []

  const { data: unread } = trpc.mensaje.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: role === "DOCTOR",
  })
  const unreadCount = unread?.count ?? 0

  const sidebarContent = (
    <aside
      className={cn(
        // Mobile: fixed drawer that slides in/out.
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out",
        // Desktop: STICKY so it stays visible while scrolling the main content.
        // Uses sticky positioning (not fixed) so it respects the document flow
        // and the parent grid sets its height to viewport. The internal
        // overflow-y-auto lets long menus scroll within the sidebar itself.
        "lg:sticky lg:top-0 lg:z-30 lg:w-56 lg:h-screen lg:translate-x-0 lg:overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {workspaceLogoUrl ? (
              <img src={workspaceLogoUrl} alt="Logo" className="h-8 w-auto object-contain rounded" />
            ) : (
              <>
                <Stethoscope size={20} className="text-blue-400" />
                <span className="font-bold text-lg tracking-tight">
                  <span className="text-[#FFD100]">Med</span>
                  <span className="text-[#3B82F6]">Sys</span>
                  <span className="text-[#EF4444]">VE</span>
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {(role === "DOCTOR" || role === "SECRETARY") && <NotificationBell />}
            {/* Close button visible only on mobile/tablet */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <p className="text-slate-400 text-xs mt-1 truncate">{workspaceNombre}</p>
        {role === "DOCTOR" && <WorkspaceSwitcher />}
      </div>

      {/* Quick search hint */}
      <div className="px-3 pb-2 pt-2">
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))
          }}
          className="flex w-full items-center gap-2 rounded-md border border-slate-800 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          <Search size={12} />
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="font-mono text-[10px]">⌘K</kbd>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === href
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            {label === "Mensajes" && unreadCount > 0 && (
              <span className="rounded-full bg-blue-500 text-white text-[10px] min-w-[16px] h-4 px-1 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 w-full transition-colors mb-1"
          >
            <ShieldAlert size={16} />
            Panel Admin
          </Link>
        )}
        <div className="px-3 py-2 mb-1">
          <p className="text-slate-300 text-sm font-medium truncate">{nombre} {apellido}</p>
          <p className="text-slate-500 text-xs">{role.charAt(0) + role.slice(1).toLowerCase()}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile/tablet top bar — hidden on desktop */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 bg-slate-900 border-b border-slate-800">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          {workspaceLogoUrl ? (
            <img src={workspaceLogoUrl} alt="Logo" className="h-6 w-auto object-contain rounded" />
          ) : (
            <>
              <Stethoscope size={18} className="text-blue-400" />
              <span className="font-bold text-base tracking-tight">
                <span className="text-[#FFD100]">Med</span>
                <span className="text-[#3B82F6]">Sys</span>
                <span className="text-[#EF4444]">VE</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center">
          {(role === "DOCTOR" || role === "SECRETARY") && <NotificationBell />}
        </div>
      </header>

      {/* Backdrop — visible when sidebar is open on mobile/tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      {sidebarContent}
    </>
  )
}

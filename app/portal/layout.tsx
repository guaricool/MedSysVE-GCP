"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PortalLogoutButton } from "@/components/portal/portal-logout-button"

const NAV = [
  { href: "/portal", label: "Inicio" },
  { href: "/portal/search", label: "Buscar Médicos" },
  { href: "/portal/perfil", label: "Mi Perfil" },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname.startsWith("/portal/verify")) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 flex-wrap">
          <Link href="/portal" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
            <span className="text-[#FFD100]">Med</span>
            <span className="text-[#3B82F6]">Sys</span>
            <span className="text-[#EF4444]">VE</span>
            <span className="text-white font-normal text-sm ml-2">— Portal del Paciente</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex gap-4 flex-wrap">
              {NAV.map((n) => {
                const isActive = pathname === n.href
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`text-sm transition-colors ${
                      isActive ? "text-[#3B82F6] font-semibold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {n.label}
                  </Link>
                )
              })}
            </nav>
            <PortalLogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  )
}

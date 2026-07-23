import Link from "next/link"
import type { SessionUser } from "@/types"
import { db } from "@/lib/db"
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { CommandPalette } from "@/components/search/command-palette"
import { InactivityGuard } from "@/components/auth/inactivityGuard"
import { SupportBot } from "@/components/support/support-bot"
import { requireLegalAcceptance } from "./require-legal-acceptance"

import { CompleteProfileBanner } from "@/components/auth/complete-profile-banner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser

  // Defense-in-depth role isolation (2026-07-07): proxy.ts already blocks
  // a patient session from reaching this layout, but if the proxy ever
  // regresses we still want the layout to refuse rendering the doctor UI
  // to a PATIENT session. Without this, the dashboard queries ran with
  // empty `doctorId`/`workspaceId` and rendered an empty doctor view
  // (avatar "L P", 0/0/0 stats, "Cargando crónicos…").
  if (user.role === "PATIENT") redirect("/portal")

  // For DOCTOR role: enforce LOPDP Art. 25 explicit consent BEFORE showing
  // any dashboard UI. For other roles (STAFF, NURSE, etc.) we skip the gate
  // because the legal docs are signed by the doctor, not the staff.
  let legalAcceptanceChildren: React.ReactNode = children
  if (user.role === "DOCTOR") {
    const fullDoctor = await db.doctor.findUnique({
      where: { id: user.doctorId },
      select: { currentLegalVersion: true, isOnboardingComplete: true },
    })
    legalAcceptanceChildren = await requireLegalAcceptance({
      doctorId: user.doctorId,
      workspaceId: user.workspaceId,
      currentLegalVersion: fullDoctor?.currentLegalVersion ?? null,
      children,
    })
  }

  const [workspace, doctor] = await Promise.all([
    db.workspace.findUnique({ where: { id: user.workspaceId }, select: { nombre: true, logoUrl: true } }),
    user.role === "DOCTOR"
      ? db.doctor.findUnique({
          where: { id: user.doctorId },
          select: { isAdmin: true, mppsMatricula: true, rif: true, nombre: true, apellido: true },
        })
      : null,
  ])

  const hasMpps = Boolean(doctor?.mppsMatricula && doctor.mppsMatricula.trim().length > 2)
  const hasRif = Boolean(doctor?.rif && doctor.rif.trim().length >= 8)

  return (
    <div className="flex min-h-screen bg-slate-950 pt-14 lg:pt-0">
      <InactivityGuard />
      <Sidebar
        role={user.role}
        nombre={user.nombre}
        apellido={user.apellido}
        workspaceNombre={workspace?.nombre ?? "Consultorio"}
        workspaceLogoUrl={workspace?.logoUrl ?? null}
        isAdmin={doctor?.isAdmin ?? false}
      />
      <main className="min-w-0 flex-1 p-4 md:p-6 pb-24">
        {user.role === "DOCTOR" && (!hasMpps || !hasRif) && (
          <CompleteProfileBanner
            doctorName={`${doctor?.nombre ?? ""} ${doctor?.apellido ?? ""}`.trim()}
            hasMpps={hasMpps}
            hasRif={hasRif}
          />
        )}
        {legalAcceptanceChildren}
        <footer className="mt-12 pt-6 border-t border-slate-800 text-center text-[11px] text-slate-500 space-y-1">
          <p>
            MedSysVE © {new Date().getFullYear()} — operado por{" "}
            <span className="text-amber-400 font-semibold">Yoguitech.LLC</span>
          </p>
          <p className="space-x-3">
            <Link href="/legal/terminos" className="hover:text-amber-400 transition-colors">
              Términos
            </Link>
            <span className="text-slate-700">·</span>
            <Link href="/legal/privacidad" className="hover:text-amber-400 transition-colors">
              Privacidad
            </Link>
            <span className="text-slate-700">·</span>
            <Link href="/legal/cookies" className="hover:text-amber-400 transition-colors">
              Cookies
            </Link>
            <span className="text-slate-700">·</span>
            <a href="mailto:yoguitech@gmail.com" className="hover:text-amber-400 transition-colors">
              Contacto
            </a>
          </p>
        </footer>
      </main>
      <CommandPalette />
      <CookieConsentBanner />
      <SupportBot />
    </div>
  )
}
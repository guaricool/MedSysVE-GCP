import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import type { SessionUser } from "@/types"
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts"
import { StaffNotesBoard } from "@/components/dashboard/staff-notes-board"
import { ChronicsPanel } from "@/components/dashboard/chronics-panel"
import { urlToFsPath } from "@/lib/pdf/header-logic"

import { formatDoctorName } from "@/lib/doctor-utils"

export default async function DoctorDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const [doctorFull, workspace, clinic, citasHoy] = await Promise.all([
    db.doctor.findUnique({
      where: { id: user.doctorId },
      select: {
        prefijo: true,
        nombre: true,
        apellido: true,
        fotoUrl: true,
        especialidadPrincipal: true,
        subEspecialidades: true,
        bio: true,
        idiomas: true,
        plan: true,
      },
    }),
    db.workspace.findUnique({
      where: { id: user.workspaceId },
      include: {
        clinic: { select: { logoUrl: true, nombre: true, bannerUrl: true } },
        _count: {
          select: {
            patientRegs: true,
            staff: { where: { activo: true } },
            appointments: {
              where: {
                fechaHora: { gte: today, lte: todayEnd },
                status: { in: ["SCHEDULED", "CONFIRMED"] },
              },
            },
          },
        },
      },
    }),
    db.workspace.findUnique({
      where: { id: user.workspaceId },
      select: { clinic: { select: { logoUrl: true, nombre: true } } },
    }),
    db.appointment.findMany({
      where: {
        workspaceId: user.workspaceId,
        fechaHora: { gte: today, lte: todayEnd },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      include: { patientRegistration: { include: { patient: true } } },
      orderBy: { fechaHora: "asc" },
    }),
  ])

  const fotoPath = urlToFsPath(doctorFull?.fotoUrl ?? null)
  const clinicLogoPath = urlToFsPath(workspace?.clinic?.logoUrl ?? null)
  const clinicName = workspace?.clinic?.nombre
  // Avatar priority: workspace logo (the brand Dayana picked) > doctor's
  // personal profile photo > initials. Without this the dashboard always
  // shows "DM" even after a logo upload, because FotoPath checks only the
  // doctor's profile photo, not the workspace's logoUrl.
  const workspaceLogoPath = urlToFsPath(workspace?.logoUrl ?? null)
  const avatarUrl = workspaceLogoPath
    ? workspace?.logoUrl
    : fotoPath
      ? doctorFull?.fotoUrl ?? null
      : null
  const avatarPath = avatarUrl ? urlToFsPath(avatarUrl) : null

  // Hour-of-day greeting in es-VE
  const hour = new Date().getHours()
  const greeting =
    hour < 6
      ? "Buenas noches"
      : hour < 12
        ? "Buenos días"
        : hour < 19
          ? "Buenas tardes"
          : "Buenas noches"

  const isPremium = doctorFull?.plan === "premium"
  const planLabel = doctorFull?.plan === "premium" ? "Premium" : doctorFull?.plan === "trial" ? "Trial" : "Free"

  return (
    <div className="space-y-6">
      {/* Premium session-start greeting */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 md:p-8 shadow-lg shadow-black/20">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="relative shrink-0">
            {avatarPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl ?? ""}
                alt={`Logo de ${workspace?.nombre ?? "Consultorio"}`}
                width={88}
                height={88}
                className="w-22 h-22 rounded-full object-cover border-2 border-amber-500/40 shadow-md shadow-amber-500/10"
                style={{ width: 88, height: 88 }}
              />
            ) : (
              <div className="w-22 h-22 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl text-slate-500 font-semibold" style={{ width: 88, height: 88 }}>
                {user.nombre?.[0]}{user.apellido?.[0]}
              </div>
            )}
            {isPremium && (
              <span
                title="Cuenta Premium"
                className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-slate-900 text-xs font-bold border-2 border-slate-900"
              >
                ★
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest text-amber-400/90 mb-1">
              {greeting}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              {formatDoctorName(doctorFull || user)}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              {doctorFull?.especialidadPrincipal}
              {doctorFull?.subEspecialidades?.length
                ? ` · ${doctorFull.subEspecialidades.slice(0, 2).join(" · ")}`
                : ""}
            </p>
            {workspace?.nombre && (
              <p className="text-slate-500 text-xs mt-1 flex items-center gap-2 flex-wrap">
                {clinicLogoPath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={workspace.clinic?.logoUrl ?? ""}
                    alt=""
                    width={20}
                    height={20}
                    className="inline-block w-5 h-5 rounded-sm object-cover bg-white p-0.5"
                    style={{ width: 20, height: 20 }}
                  />
                )}
                <span>{workspace.nombre}{clinicName ? ` · ${clinicName}` : ""}</span>
                <span className="text-slate-700">·</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                  isPremium
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {planLabel}
                </span>
              </p>
            )}
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Hoy</p>
            <p className="text-lg font-semibold text-white">
              {new Date().toLocaleDateString("es-VE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "America/Caracas",
              })}
            </p>
          </div>
        </div>
      </section>

      <DashboardAlerts />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Pacientes registrados"
          value={workspace?._count.patientRegs ?? 0}
          color="blue"
          href="/doctor/patients"
        />
        <StatCard
          label="Staff activo"
          value={workspace?._count.staff ?? 0}
          color="green"
          href="/doctor/staff"
        />
        <StatCard
          label="Citas hoy"
          value={workspace?._count.appointments ?? 0}
          color="purple"
          href="/doctor/appointments"
        />
      </div>

      {citasHoy.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Citas de hoy
          </h2>
          <ul className="space-y-2">
            {citasHoy.map((c) => {
              const href = c.patientRegistration 
                ? `/doctor/patients/${c.patientRegistration.id}` 
                : "/doctor/appointments";
              
              return (
                <li key={c.id}>
                  <Link 
                    href={href}
                    className="flex items-center gap-3 text-sm hover:bg-slate-800/60 p-2 -mx-2 rounded transition-colors group"
                  >
                    <span className="text-blue-400 font-mono text-xs w-12 shrink-0">
                      {new Date(c.fechaHora).toLocaleTimeString("es-VE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: 'America/Caracas',
                      })}
                    </span>
                    <span className="text-white group-hover:text-amber-400 transition-colors">
                      {c.patientRegistration
                        ? `${c.patientRegistration.patient.nombre} ${c.patientRegistration.patient.apellido}`
                        : c.titulo ?? "Cita"}
                    </span>
                    <span className="text-slate-500 text-xs ml-auto">{c.duracionMinutos} min</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ChronicsPanel />

      <StaffNotesBoard />
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  href,
}: {
  label: string
  value: number
  color: "blue" | "green" | "purple"
  href?: string
}) {
  const borderColors = {
    blue: "border-l-blue-500 hover:border-l-blue-400",
    green: "border-l-emerald-500 hover:border-l-emerald-400",
    purple: "border-l-purple-500 hover:border-l-purple-400",
  }
  
  const content = (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-lg p-5 border-l-4 transition-colors ${borderColors[color]} ${href ? 'hover:bg-slate-800/80 cursor-pointer' : ''}`}
    >
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }
  
  return content
}
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"

const ADMIN_EMAIL = "cpierluissis@gmail.com"

export default async function AdminCompliancePage() {
  const session = await auth()
  if (!session?.user || session.user.email !== ADMIN_EMAIL) redirect("/doctor")

  const [
    totalDoctors,
    doctorsWithConsent,
    pendingExports,
    pendingDeletions,
    openBreaches,
    legalVersions,
    pendingExportRows,
    pendingDeletionRows,
    openBreachRows,
  ] = await Promise.all([
    db.doctor.count(),
    db.doctor.count({ where: { currentLegalVersion: { not: null } } }),
    db.dataExportRequest.count({ where: { status: { in: ["REQUESTED", "READY"] } } }),
    db.dataDeletionRequest.count({ where: { status: "REQUESTED" } }),
    db.breachIncident.count({
      where: { status: { in: ["INVESTIGATING", "CONTAINED", "NOTIFIED"] } },
    }),
    db.legalVersion.findMany({ orderBy: { effectiveAt: "desc" }, take: 8 }),
    db.dataExportRequest.findMany({
      where: { status: { in: ["REQUESTED", "READY"] } },
      include: { doctor: { select: { nombre: true, apellido: true, email: true } } },
      orderBy: { requestedAt: "desc" },
      take: 10,
    }),
    db.dataDeletionRequest.findMany({
      where: { status: "REQUESTED" },
      include: { doctor: { select: { nombre: true, apellido: true, email: true } } },
      orderBy: { requestedAt: "desc" },
      take: 10,
    }),
    db.breachIncident.findMany({
      where: { status: { in: ["INVESTIGATING", "CONTAINED", "NOTIFIED"] } },
      orderBy: { detectedAt: "desc" },
      take: 10,
    }),
  ])

  const cards = [
    {
      label: "Doctores sin consentimiento",
      value: totalDoctors - doctorsWithConsent,
      total: totalDoctors,
      tone: "amber" as const,
    },
    { label: "Exportaciones pendientes", value: pendingExports, tone: "blue" as const },
    { label: "Eliminaciones pendientes", value: pendingDeletions, tone: "red" as const },
    { label: "Incidentes abiertos", value: openBreaches, tone: "red" as const },
  ]

  const toneClass = {
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    blue: "text-sky-400 bg-sky-400/10 border-sky-400/30",
    red: "text-red-400 bg-red-400/10 border-red-400/30",
    green: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-white mb-1">Cumplimiento Legal (LOPDP)</h2>
        <p className="text-slate-400 text-sm">
          Consentimientos, solicitudes de exportación/eliminación y registro de incidentes.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border bg-slate-900 p-5 ${toneClass[c.tone]}`}
          >
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">{c.label}</p>
            <p className="text-3xl font-bold">
              {c.value.toLocaleString()}
              {c.total !== undefined && (
                <span className="text-sm font-normal text-slate-500"> / {c.total}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Versiones legales publicadas</h3>
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Documento</th>
                <th className="text-left px-4 py-3">Versión</th>
                <th className="text-left px-4 py-3">Vigente desde</th>
                <th className="text-left px-4 py-3">Hash SHA-256 (8)</th>
              </tr>
            </thead>
            <tbody>
              {legalVersions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Aún no se han publicado versiones legales. Las versiones se crean
                    automáticamente al registrarse un doctor.
                  </td>
                </tr>
              ) : (
                legalVersions.map((v) => (
                  <tr key={v.id} className="border-b border-slate-800/50">
                    <td className="px-4 py-3 text-white">{v.title}</td>
                    <td className="px-4 py-3 text-amber-400 font-mono">{v.version}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {v.effectiveAt.toLocaleDateString("es-VE", { timeZone: "America/Caracas" })}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {v.contentHash.slice(0, 16)}…
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Solicitudes de exportación de datos</h3>
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Doctor</th>
                <th className="text-left px-4 py-3">Alcance</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Solicitado</th>
                <th className="text-left px-4 py-3">Expira</th>
              </tr>
            </thead>
            <tbody>
              {pendingExportRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No hay solicitudes pendientes.
                  </td>
                </tr>
              ) : (
                pendingExportRows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/50">
                    <td className="px-4 py-3 text-white">
                      Dr. {r.doctor.nombre} {r.doctor.apellido}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{r.scope}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {r.requestedAt.toLocaleString("es-VE", { timeZone: "America/Caracas" })}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {r.expiresAt?.toLocaleDateString("es-VE", { timeZone: "America/Caracas" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Solicitudes de eliminación / cancelación</h3>
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Doctor</th>
                <th className="text-left px-4 py-3">Tombstone</th>
                <th className="text-left px-4 py-3">Razón</th>
                <th className="text-left px-4 py-3">Solicitado</th>
              </tr>
            </thead>
            <tbody>
              {pendingDeletionRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No hay solicitudes pendientes.
                  </td>
                </tr>
              ) : (
                pendingDeletionRows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/50">
                    <td className="px-4 py-3 text-white">
                      Dr. {r.doctor.nombre} {r.doctor.apellido}
                    </td>
                    <td className="px-4 py-3 text-amber-400 font-mono text-xs">{r.tombstoneId ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-md truncate">{r.reason ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {r.requestedAt.toLocaleString("es-VE", { timeZone: "America/Caracas" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Incidentes de seguridad abiertos</h3>
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          {openBreachRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-500 text-sm">
              No hay incidentes abiertos. (LOPDP Art. 64 — deber de notificación.)
            </p>
          ) : (
            <ul className="divide-y divide-slate-800/50">
              {openBreachRows.map((b) => (
                <li key={b.id} className="px-4 py-3 flex items-center gap-3">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      b.severity === "CRITICAL"
                        ? "border-red-500/40 bg-red-500/10 text-red-300"
                        : b.severity === "HIGH"
                          ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {b.severity}
                  </span>
                  <span className="text-white font-medium flex-1 truncate">{b.title}</span>
                  <span className="text-xs text-slate-500">
                    Detectado {b.detectedAt.toLocaleDateString("es-VE", { timeZone: "America/Caracas" })}
                  </span>
                  <span className="text-xs text-slate-400">
                    {b.affectedUsers} usuarios afectados
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
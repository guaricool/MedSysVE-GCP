"use client"
import { useState } from "react"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ComplianceClient() {
  const [cedula, setCedula] = useState("")
  const [reason, setReason] = useState("")
  const [lastExport, setLastExport] = useState<unknown>(null)

  const exportMutation = trpc.compliance.requestPatientExport.useMutation({
    onSuccess: (data) => {
      toast.success("Exportación generada. Revisa la consola para verla.")
      setLastExport(data)
      // eslint-disable-next-line no-console
      console.log("[LOPDP export]", data)
    },
    onError: (e) => toast.error(e.message),
  })

  const deletionMutation = trpc.compliance.requestDeletion.useMutation({
    onSuccess: (data) =>
      toast.success(
        `Solicitud de cancelación registrada (ID ${data.requestId.slice(0, 8)}…). Un administrador la revisará.`,
      ),
    onError: (e) => toast.error(e.message),
  })

  const myExports = trpc.compliance.listMyExports.useQuery()
  const myDeletions = trpc.compliance.listMyDeletions.useQuery()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export card */}
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-5 space-y-3">
          <header>
            <p className="text-xs uppercase tracking-widest text-sky-300 font-semibold">
              LOPDP Art. 60
            </p>
            <h2 className="text-lg font-semibold text-white">
              Solicitar exportación de datos
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              Genera un archivo JSON con toda la información del paciente: consultas,
              diagnósticos, recetas, alergias, vacunas, mensajes, consentimientos.
            </p>
          </header>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              exportMutation.mutate({ cedula })
            }}
            className="space-y-2"
          >
            <Label className="text-slate-300 text-xs">Cédula del paciente</Label>
            <Input
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="12345678"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Button
              type="submit"
              disabled={exportMutation.isPending || cedula.length < 6}
              className="w-full"
            >
              {exportMutation.isPending ? "Generando…" : "Generar exportación"}
            </Button>
          </form>
          {lastExport ? (
            <p className="text-xs text-emerald-300">
              ✓ Exportación generada. Token: {(lastExport as { token: string }).token.slice(0, 12)}…
              — revisa la consola del navegador para descargar el JSON.
            </p>
          ) : null}
        </div>

        {/* Deletion card */}
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 space-y-3">
          <header>
            <p className="text-xs uppercase tracking-widest text-red-300 font-semibold">
              LOPDP Art. 61
            </p>
            <h2 className="text-lg font-semibold text-white">
              Solicitar cancelación de datos
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              Solicita la anonimización irreversible del paciente. Los registros se
              preservan sin información personal (LOPDP + obligación legal de conservar
              historias clínicas mínimo 5 años).
            </p>
          </header>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              deletionMutation.mutate({ cedula, reason: reason || undefined })
            }}
            className="space-y-2"
          >
            <Label className="text-slate-300 text-xs">Cédula del paciente</Label>
            <Input
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="12345678"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Label className="text-slate-300 text-xs">Motivo (opcional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: paciente cambió de médico"
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Button
              type="submit"
              variant="destructive"
              disabled={deletionMutation.isPending || cedula.length < 6}
              className="w-full"
            >
              {deletionMutation.isPending ? "Enviando…" : "Solicitar cancelación"}
            </Button>
          </form>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ListCard
          title="Mis exportaciones"
          empty="No has solicitado exportaciones todavía."
          items={(myExports.data ?? []).map((e: { id: string; scope: string; status: string; requestedAt: Date | string }) => ({
            id: e.id,
            primary: `${e.scope} · ${e.status}`,
            secondary: `Solicitado ${formatDate(e.requestedAt)}`,
          }))}
        />
        <ListCard
          title="Mis solicitudes de cancelación"
          empty="No has solicitado cancelaciones todavía."
          items={(myDeletions.data ?? []).map((e: { id: string; tombstoneId: string | null; status: string; requestedAt: Date | string }) => ({
            id: e.id,
            primary: `${e.tombstoneId ?? "—"} · ${e.status}`,
            secondary: `Solicitado ${formatDate(e.requestedAt)}`,
          }))}
        />
      </section>
    </div>
  )
}

function ListCard({
  title,
  empty,
  items,
}: {
  title: string
  empty: string
  items?: Array<{ id: string; primary: string; secondary: string }>
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
        {title}
      </h3>
      {!items || items.length === 0 ? (
        <p className="text-xs text-slate-500">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="border-b border-slate-800/50 pb-2 last:border-0">
              <p className="text-sm text-white">{it.primary}</p>
              <p className="text-xs text-slate-500">{it.secondary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function formatDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d
  if (isNaN(dt.getTime())) return "—"
  return dt.toLocaleString("es-VE", { timeZone: "America/Caracas" })
}
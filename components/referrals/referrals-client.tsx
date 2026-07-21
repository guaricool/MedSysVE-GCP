"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import {
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  X,
  GitMerge,
  ArrowRight,
  Equal,
} from "lucide-react"

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  SENT: { label: "Pendiente", cls: "bg-yellow-900/40 text-yellow-300 border-yellow-700" },
  ACCEPTED: { label: "Aceptado", cls: "bg-green-900/40 text-green-300 border-green-700" },
  REJECTED: { label: "Rechazado", cls: "bg-red-900/40 text-red-300 border-red-700" },
  MERGE_PENDING: {
    label: "Merge pendiente",
    cls: "bg-amber-900/40 text-amber-300 border-amber-700",
  },
}

type MergePayload = {
  documentId: string
  existingPatient: {
    id: string
    nombre: string
    apellido: string
    fechaNacimiento: Date | string
    sexo: string
    telefono: string | null
    email: string | null
  }
  referredPatient: {
    id: string
    nombre: string
    apellido: string
    fechaNacimiento: Date | string
    sexo: string
    telefono: string | null
    email: string | null
  }
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("es-VE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Caracas",
  })
}

function fmtSexo(s: string): string {
  if (s === "MASCULINO") return "Masculino"
  if (s === "FEMENINO") return "Femenino"
  return s || "—"
}

function Row({
  label,
  mine,
  theirs,
}: {
  label: string
  mine: string | null | undefined
  theirs: string | null | undefined
}) {
  const differs = (mine ?? "") !== (theirs ?? "")
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5 text-xs">
      <div
        className={`rounded px-2 py-1 ${
          differs
            ? "bg-amber-950/40 text-amber-100 ring-1 ring-amber-700/40"
            : "bg-slate-900/40 text-slate-300"
        }`}
      >
        <div className="text-[10px] uppercase tracking-wide text-slate-500">
          Tu consultorio
        </div>
        <div className="font-medium">{mine || <span className="text-slate-600">—</span>}</div>
      </div>
      <div className="text-slate-600">
        {differs ? <ArrowRight size={12} /> : <Equal size={12} />}
      </div>
      <div
        className={`rounded px-2 py-1 ${
          differs
            ? "bg-blue-950/40 text-blue-100 ring-1 ring-blue-700/40"
            : "bg-slate-900/40 text-slate-300"
        }`}
      >
        <div className="text-[10px] uppercase tracking-wide text-slate-500">
          Del referido
        </div>
        <div className="font-medium">{theirs || <span className="text-slate-600">—</span>}</div>
      </div>
      {/* Spacer to give the row a left label area in the parent grid */}
      <div className="col-span-3 -mt-1 mb-1 text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </div>
    </div>
  )
}

export function ReferralsClient() {
  const utils = trpc.useUtils()
  const { data: referrals, isLoading } = trpc.document.listIncomingReferrals.useQuery()
  const [feedback, setFeedback] = useState<{ id: string; msg: string; kind?: "ok" | "warn" } | null>(
    null,
  )
  const [mergePayload, setMergePayload] = useState<MergePayload | null>(null)

  const accept = (trpc.document as any).acceptReferral.useMutation({
    onSuccess: (result: any, vars: { documentId: string }) => {
      utils.document.listIncomingReferrals.invalidate()
      if (result?.needsMerge) {
        setMergePayload({
          documentId: vars.documentId,
          existingPatient: {
            id: result.existingPatient.id,
            nombre: result.existingPatient.nombre,
            apellido: result.existingPatient.apellido,
            fechaNacimiento: result.existingPatient.fechaNacimiento,
            sexo: result.existingPatient.sexo,
            telefono: result.existingPatient.telefono,
            email: result.existingPatient.email,
          },
          referredPatient: {
            id: result.referredPatient.id,
            nombre: result.referredPatient.nombre,
            apellido: result.referredPatient.apellido,
            fechaNacimiento: result.referredPatient.fechaNacimiento,
            sexo: result.referredPatient.sexo,
            telefono: result.referredPatient.telefono,
            email: result.referredPatient.email,
          },
        })
      } else {
        setFeedback({ id: vars.documentId, msg: "Paciente registrado en su consultorio.", kind: "ok" })
        setTimeout(() => setFeedback(null), 4000)
      }
    },
  })

  const resolve = (trpc.document as any).resolveReferralMerge.useMutation({
    onSuccess: (_: unknown, vars: { documentId: string; action: "keep" | "update" }) => {
      utils.document.listIncomingReferrals.invalidate()
      setMergePayload(null)
      setFeedback({
        id: vars.documentId,
        msg:
          vars.action === "update"
            ? "Datos del paciente actualizados con los del referido."
            : "Vinculado a tu paciente existente. Tus datos quedaron igual.",
        kind: "ok",
      })
      setTimeout(() => setFeedback(null), 4000)
    },
  })

  const reject = (trpc.document as any).rejectReferral.useMutation({
    onSuccess: (_: unknown, vars: { documentId: string }) => {
      utils.document.listIncomingReferrals.invalidate()
      setFeedback({ id: vars.documentId, msg: "Referido rechazado.", kind: "warn" })
      setTimeout(() => setFeedback(null), 3000)
    },
  })

  if (isLoading) return <p className="text-sm text-slate-400">Cargando referidos...</p>

  if (!referrals || referrals.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">No ha recibido referidos aún.</p>
        <p className="mt-1 text-xs text-slate-500">
          Cuando otro médico le refiera un paciente, aparecerá aquí.
        </p>
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-3">
        {(referrals as any[]).map((r: any) => {
          const status = r.referidoStatus as string | null
          const statusInfo = status ? STATUS_LABEL[status] : null
          const isPending = !status || status === "SENT"
          const isMergePending = status === "MERGE_PENDING"
          const isBusy = accept.isPending || reject.isPending || resolve.isPending

          return (
            <li
              key={r.id}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">
                    {r.patientRegistration.patient.nombre}{" "}
                    {r.patientRegistration.patient.apellido}
                  </p>
                  <p className="text-xs text-slate-400">
                    {r.patientRegistration.idDisplay} ·{" "}
                    {new Date(r.createdAt).toLocaleDateString("es-VE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "America/Caracas",
                    })}
                  </p>
                  {r.referidoAEspecialidad && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Especialidad: {r.referidoAEspecialidad}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {statusInfo && (
                    <span className={`rounded border px-2 py-0.5 text-xs font-medium ${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                  )}
                  <a
                    href={`/api/pdf/document/${r.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-blue-400"
                    title="Ver PDF del referido"
                  >
                    <FileText size={16} />
                  </a>
                </div>
              </div>

              {r.contenidoHtml && (
                <div
                  className="prose prose-invert prose-sm max-w-none text-slate-300"
                  dangerouslySetInnerHTML={{ __html: r.contenidoHtml }}
                />
              )}

              {isMergePending && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-200">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Este paciente ya existe en tu consultorio.</p>
                    <p className="mt-0.5 text-amber-300/80">
                      Detectamos que ya tienes un paciente con la misma cédula. Revisa los datos
                      y decide si mantienes los tuyos o actualizas con los del referido.
                    </p>
                  </div>
                  <button
                    disabled={isBusy}
                    onClick={() =>
                      accept.mutate({ documentId: r.id }, {
                        onSuccess: (result: any) => {
                          if (result?.needsMerge) {
                            setMergePayload({
                              documentId: r.id,
                              existingPatient: {
                                id: result.existingPatient.id,
                                nombre: result.existingPatient.nombre,
                                apellido: result.existingPatient.apellido,
                                fechaNacimiento: result.existingPatient.fechaNacimiento,
                                sexo: result.existingPatient.sexo,
                                telefono: result.existingPatient.telefono,
                                email: result.existingPatient.email,
                              },
                              referredPatient: {
                                id: result.referredPatient.id,
                                nombre: result.referredPatient.nombre,
                                apellido: result.referredPatient.apellido,
                                fechaNacimiento: result.referredPatient.fechaNacimiento,
                                sexo: result.referredPatient.sexo,
                                telefono: result.referredPatient.telefono,
                                email: result.referredPatient.email,
                              },
                            })
                          }
                        },
                      })
                    }
                    className="flex items-center gap-1.5 rounded border border-amber-700 bg-amber-900/40 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-900/60 disabled:opacity-50"
                  >
                    <GitMerge size={13} />
                    Resolver
                  </button>
                </div>
              )}

              {feedback?.id === r.id && feedback && (
                <p
                  className={`text-xs ${
                    feedback.kind === "warn" ? "text-amber-400" : "text-green-400"
                  }`}
                >
                  {feedback.msg}
                </p>
              )}

              {isPending && (
                <div className="flex gap-2 pt-1">
                  <button
                    disabled={isBusy}
                    onClick={() => accept.mutate({ documentId: r.id })}
                    className="flex items-center gap-1.5 rounded border border-green-700 bg-green-900/30 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-900/50 disabled:opacity-50"
                  >
                    <CheckCircle size={13} />
                    Aceptar referido
                  </button>
                  <button
                    disabled={isBusy}
                    onClick={() => {
                      if (window.confirm("¿Confirma rechazar esta remisión médica de paciente?")) {
                        reject.mutate({ documentId: r.id })
                      }
                    }}
                    className="flex items-center gap-1.5 rounded border border-red-800 bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/50 disabled:opacity-50"
                  >
                    <XCircle size={13} />
                    Rechazar
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {mergePayload && (
        <MergeDialog
          payload={mergePayload}
          isBusy={resolve.isPending}
          onClose={() => setMergePayload(null)}
          onResolve={(action) =>
            resolve.mutate({ documentId: mergePayload.documentId, action })
          }
        />
      )}
    </>
  )
}

function MergeDialog({
  payload,
  isBusy,
  onClose,
  onResolve,
}: {
  payload: MergePayload
  isBusy: boolean
  onClose: () => void
  onResolve: (action: "keep" | "update") => void
}) {
  const { existingPatient, referredPatient } = payload

  const differCount =
    (existingPatient.nombre !== referredPatient.nombre ? 1 : 0) +
    (existingPatient.apellido !== referredPatient.apellido ? 1 : 0) +
    (fmtDate(existingPatient.fechaNacimiento) !== fmtDate(referredPatient.fechaNacimiento)
      ? 1
      : 0) +
    (existingPatient.sexo !== referredPatient.sexo ? 1 : 0) +
    ((existingPatient.telefono ?? "") !== (referredPatient.telefono ?? "") ? 1 : 0) +
    ((existingPatient.email ?? "") !== (referredPatient.email ?? "") ? 1 : 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="merge-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 bg-slate-950 px-5 py-4">
          <div>
            <h2 id="merge-dialog-title" className="flex items-center gap-2 text-base font-semibold text-white">
              <GitMerge size={16} className="text-amber-400" />
              Este paciente ya existe en tu consultorio
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Comparamos por cédula y encontramos un paciente tuyo con la misma
              identificación. Decide si mantienes tus datos o actualizas con los
              del referido.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Diff */}
        <div className="space-y-2 px-5 py-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tu consultorio</span>
            <span>Del referido</span>
          </div>
          <div className="space-y-1 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <Row
              label="Nombre"
              mine={existingPatient.nombre}
              theirs={referredPatient.nombre}
            />
            <Row
              label="Apellido"
              mine={existingPatient.apellido}
              theirs={referredPatient.apellido}
            />
            <Row
              label="Fecha de nacimiento"
              mine={fmtDate(existingPatient.fechaNacimiento)}
              theirs={fmtDate(referredPatient.fechaNacimiento)}
            />
            <Row
              label="Sexo"
              mine={fmtSexo(existingPatient.sexo)}
              theirs={fmtSexo(referredPatient.sexo)}
            />
            <Row
              label="Teléfono"
              mine={existingPatient.telefono}
              theirs={referredPatient.telefono}
            />
            <Row
              label="Email"
              mine={existingPatient.email}
              theirs={referredPatient.email}
            />
          </div>
          <p className="text-xs text-slate-500">
            {differCount === 0
              ? "No hay diferencias en los datos demográficos. Puedes aceptar de cualquier forma."
              : `${differCount} campo${differCount === 1 ? "" : "s"} difiere${differCount === 1 ? "" : "n"} entre tus datos y los del referido.`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-slate-800 bg-slate-950 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onResolve("keep")}
            className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-50"
          >
            Mantener mis datos
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onResolve("update")}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Actualizar con datos del referido
          </button>
        </div>
      </div>
    </div>
  )
}

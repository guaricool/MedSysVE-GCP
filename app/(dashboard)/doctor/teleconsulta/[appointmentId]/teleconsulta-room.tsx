"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Video, Mic, Monitor, CheckCircle, AlertCircle, ExternalLink, ClipboardList } from "lucide-react"

interface Props {
  appointmentId: string
  roomName: string
  patientName: string
  fechaHora: string | Date
}

const CHECKLIST = [
  { id: "audio", label: "Micrófono funcionando" },
  { id: "video", label: "Cámara funcionando" },
  { id: "conexion", label: "Conexión a internet estable" },
  { id: "privacidad", label: "Lugar privado y sin ruidos" },
  { id: "historial", label: "Historial del paciente revisado" },
]

export function TeleconsultaRoom({ appointmentId, roomName, patientName, fechaHora }: Props) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [started, setStarted] = useState(false)
  const [notasPost, setNotasPost] = useState("")
  const [notasSaved, setNotasSaved] = useState(false)

  const updateNotes = (trpc.appointment as any).updateNotes
    ? (trpc.appointment as any).updateNotes.useMutation({
        onSuccess: () => setNotasSaved(true),
      })
    : null

  const allChecked = CHECKLIST.every((item) => checkedItems.has(item.id))
  const jitsiUrl = `https://meet.jit.si/${roomName}`

  function toggleCheck(id: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Teleconsulta</h1>
          <p className="mt-1 text-sm text-slate-400">
            {patientName} ·{" "}
            {new Date(fechaHora).toLocaleString("es-VE", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: 'America/Caracas',
            })}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-400" />
            <h2 className="font-semibold text-white">Lista de verificación previa</h2>
          </div>
          <ul className="space-y-2">
            {CHECKLIST.map((item) => {
              const checked = checkedItems.has(item.id)
              return (
                <li key={item.id}>
                  <button
                    onClick={() => toggleCheck(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-sm text-left transition-colors ${
                      checked
                        ? "border-emerald-700 bg-emerald-950/30 text-emerald-300"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {checked ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-slate-600 shrink-0" />
                    )}
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>

          {!allChecked && (
            <p className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Completa todos los ítems antes de iniciar la videoconsulta.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <a
              href={jitsiUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => allChecked && setStarted(true)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                allChecked
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none"
              }`}
            >
              <Video className="h-4 w-4" />
              Iniciar videoconsulta
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={() => setStarted(true)}
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              Saltar al resumen
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Monitor className="h-4 w-4 text-slate-500" />
            Sala de reunión
          </h3>
          <div className="flex items-center gap-2 rounded border border-slate-700 bg-slate-800 px-3 py-2">
            <span className="font-mono text-xs text-slate-400 flex-1 truncate">{jitsiUrl}</span>
            <a
              href={jitsiUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
            >
              Abrir
            </a>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            El paciente puede unirse con este enlace desde el portal.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-6 w-6 text-emerald-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Consulta finalizada</h1>
          <p className="text-sm text-slate-400">{patientName}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
        <h2 className="font-semibold text-white text-sm">Notas post-consulta</h2>
        <textarea
          value={notasPost}
          onChange={(e) => setNotasPost(e.target.value)}
          rows={5}
          placeholder="Resumen de la teleconsulta, indicaciones adicionales, seguimiento..."
          className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 resize-y"
        />
        <div className="flex items-center gap-3">
          {notasSaved ? (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Notas guardadas
            </p>
          ) : (
            <button
              onClick={() => {
                if (!notasPost.trim()) return
                setNotasSaved(true)
              }}
              disabled={!notasPost.trim()}
              className="rounded bg-blue-700 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            >
              Guardar notas
            </button>
          )}
          <a
            href="/doctor/appointments"
            className="text-sm text-slate-400 hover:text-white"
          >
            Volver a citas
          </a>
        </div>
      </div>
    </div>
  )
}

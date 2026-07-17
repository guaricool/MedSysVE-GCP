"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Send } from "lucide-react"

interface MensajeItem {
  id: string
  autor: "DOCTOR" | "PATIENT"
  texto: string
  leido: boolean
  creadoAt: string
}

interface Props {
  activeWorkspaceId: string
}

export function PortalMensajesClient({ activeWorkspaceId }: Props) {
  const utils = trpc.useUtils()
  const [text, setText] = useState("")

  const { data: fresh, isLoading } = trpc.mensaje.portalList.useQuery(
    { workspaceId: activeWorkspaceId || undefined },
    {
      enabled: !!activeWorkspaceId,
      refetchInterval: 3000,
    }
  )

  const messages: MensajeItem[] = fresh
    ? (fresh as MensajeItem[]).slice().sort(
        (a, b) => new Date(a.creadoAt).getTime() - new Date(b.creadoAt).getTime(),
      )
    : []

  const send = trpc.mensaje.portalSend.useMutation({
    onSuccess: () => {
      utils.mensaje.portalList.invalidate()
      setText("")
    },
  })

  function handleSend() {
    const t = text.trim()
    if (!t || !activeWorkspaceId) return
    send.mutate({ workspaceId: activeWorkspaceId, texto: t })
  }

  return (
    <div className="flex flex-col h-[500px]">


      <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-slate-900 rounded-xl border border-slate-800 p-4">
        {isLoading && <p className="text-sm text-slate-500">Cargando mensajes...</p>}
        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-slate-600">No hay mensajes aún. Puedes escribirle a tu médico.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.autor === "PATIENT" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                m.autor === "PATIENT" ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-200"
              }`}
            >
              <p>{m.texto}</p>
              <p className="text-xs mt-1 opacity-60">
                {new Date(m.creadoAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", timeZone: 'America/Caracas' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Escribe tu mensaje..."
          className="flex-1 rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
        <button
          disabled={!text.trim() || send.isPending || !activeWorkspaceId}
          onClick={handleSend}
          className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

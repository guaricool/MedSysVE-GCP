"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { MessageSquare, Send, Smartphone } from "lucide-react"

interface Convo {
  patientRegistrationId: string
  patientName: string
  lastMessage: { texto: string; creadoAt: string | Date; autor: string; canal?: string } | null
  unread: number
}

export function MensajesClient({ initialConversations }: { initialConversations: Convo[] }) {
  const [selected, setSelected] = useState<string | null>(initialConversations[0]?.patientRegistrationId ?? null)
  const [text, setText] = useState("")
  const [replyCanal, setReplyCanal] = useState<"PORTAL" | "WHATSAPP">("PORTAL")
  const utils = trpc.useUtils()

  const { data: messages = [] } = trpc.mensaje.list.useQuery(
    { patientRegistrationId: selected! },
    {
      enabled: !!selected,
      // Polling was 10s — doctor sees their own messages instantly but
      // patient replies took up to 10s. Carlos asked for tiempo real
      // (2026-07-07). 3s polling is the interim measure; true realtime
      // (WebSocket / SSE) is the next step. See audit backlog.
      refetchInterval: 3000,
    }
  )
  const send = trpc.mensaje.send.useMutation({
    onSuccess: () => {
      utils.mensaje.list.invalidate({ patientRegistrationId: selected! })
      // Sending a doctor message doesn't change the unread count (the
      // unread count tracks PATIENT messages only), but invalidating is
      // cheap insurance against any future schema changes that might
      // count doctor messages too.
      utils.mensaje.unreadCount.invalidate()
      setText("")
    },
  })
  const markRead = trpc.mensaje.markRead.useMutation({
    onSuccess: () => {
      // Critical: invalidating `list` only refreshes the open thread,
      // not the sidebar's unread badge. Without this invalidation, the
      // badge would stay stale until the next 30-second refetch —
      // creating the impression that a message is still unread after
      // the doctor opened it (Carlos reported 2026-07-07).
      utils.mensaje.unreadCount.invalidate()
    },
  })

  function handleSelect(id: string) {
    setSelected(id)
    markRead.mutate({ patientRegistrationId: id })
    const convo = initialConversations.find(c => c.patientRegistrationId === id)
    if (convo?.lastMessage?.canal === "WHATSAPP") {
      setReplyCanal("WHATSAPP")
    } else {
      setReplyCanal("PORTAL")
    }
  }

  const selectedConvo = initialConversations.find((c) => c.patientRegistrationId === selected)

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-72 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare size={18} /> Mensajes
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {initialConversations.length === 0 && (
            <p className="p-4 text-sm text-slate-600">Sin conversaciones aún</p>
          )}
          {initialConversations.map((c) => (
            <button
              key={c.patientRegistrationId}
              onClick={() => handleSelect(c.patientRegistrationId)}
              className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800 transition ${
                selected === c.patientRegistrationId ? "bg-slate-800" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white truncate">{c.patientName}</span>
                {c.unread > 0 && (
                  <span className="ml-2 rounded-full bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {c.unread}
                  </span>
                )}
              </div>
              {c.lastMessage && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {c.lastMessage.autor === "DOCTOR" ? "Tú: " : ""}
                  {c.lastMessage.texto}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="p-4 border-b border-slate-800">
              <p className="font-medium text-white">{selectedConvo?.patientName}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.autor === "DOCTOR" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                      m.autor === "DOCTOR"
                        ? "bg-blue-700 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    <p>{m.texto}</p>
                    <div className="flex items-center justify-between mt-1 opacity-60 text-xs">
                      <p>
                        {new Date(m.creadoAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", timeZone: 'America/Caracas' })}
                      </p>
                      {m.canal === "WHATSAPP" && <Smartphone size={12} className="ml-2" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-800 flex gap-2 items-center">
              <select
                value={replyCanal}
                onChange={(e) => setReplyCanal(e.target.value as "PORTAL" | "WHATSAPP")}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="PORTAL">Portal</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    if (text.trim()) send.mutate({ patientRegistrationId: selected, texto: text.trim(), canal: replyCanal })
                  }
                }}
                placeholder="Escribir mensaje..."
                className="flex-1 rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <button
                disabled={!text.trim() || send.isPending}
                onClick={() => { if (text.trim()) send.mutate({ patientRegistrationId: selected, texto: text.trim(), canal: replyCanal }) }}
                className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
            Selecciona una conversación
          </div>
        )}
      </div>
    </div>
  )
}

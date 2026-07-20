"use client"

import { useState, useRef, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Send, User, MessageCircle, CheckCircle2 } from "lucide-react"

export default function AdminMensajesClient() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [inputText, setInputText] = useState("")
  
  const utils = trpc.useUtils()
  
  const { data, isLoading } = trpc.adminMensajes.list.useQuery(undefined, {
    refetchInterval: 3000,
  })

  const sendMutation = trpc.adminMensajes.send.useMutation({
    onSuccess: () => {
      setInputText("")
      utils.adminMensajes.list.invalidate()
    }
  })

  const markReadMutation = trpc.adminMensajes.markAsRead.useMutation({
    onSuccess: () => {
      utils.adminMensajes.list.invalidate()
    }
  })

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [data, selectedPhone])

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500">Cargando mensajes...</div>
  
  const mensajes = data?.mensajes || []
  
  // Group by phone
  const conversations = mensajes.reduce((acc: any, msg: any) => {
    if (!acc[msg.telefono]) {
      acc[msg.telefono] = {
        telefono: msg.telefono,
        nombrePerfil: msg.nombrePerfil || "Desconocido",
        mensajes: [],
        unreadCount: 0,
        lastMessage: msg,
      }
    }
    acc[msg.telefono].mensajes.push(msg)
    acc[msg.telefono].lastMessage = msg
    if (msg.direccion === "INBOUND" && !msg.leido) {
      acc[msg.telefono].unreadCount++
    }
    return acc
  }, {} as Record<string, any>)

  const conversationList = Object.values(conversations).sort((a: any, b: any) => 
    new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  )

  const activeConversation = selectedPhone ? conversations[selectedPhone] : null

  const handleSelect = (telefono: string) => {
    setSelectedPhone(telefono)
    const conv = conversations[telefono]
    if (conv && conv.unreadCount > 0) {
      markReadMutation.mutate({ telefono })
    }
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedPhone) return
    sendMutation.mutate({
      telefono: selectedPhone,
      texto: inputText.trim()
    })
  }

  return (
    <div className="flex h-full divide-x divide-slate-800">
      {/* Sidebar de contactos */}
      <div className="w-1/3 bg-slate-900 overflow-y-auto">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold text-slate-200">Conversaciones</h2>
        </div>
        <div className="divide-y divide-slate-800/50">
          {conversationList.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No hay mensajes recibidos aún.
            </div>
          )}
          {conversationList.map((conv: any) => (
            <button
              key={conv.telefono}
              onClick={() => handleSelect(conv.telefono)}
              className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                selectedPhone === conv.telefono 
                  ? "bg-slate-800" 
                  : "hover:bg-slate-800/50"
              }`}
            >
              <div className="bg-slate-800 rounded-full p-2 flex-shrink-0 mt-1">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-medium text-slate-200 truncate pr-2">
                    {conv.nombrePerfil}
                  </h3>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">
                    {format(new Date(conv.lastMessage.createdAt), "HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-slate-400 truncate mb-1">
                  +{conv.telefono}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500 truncate flex-1 pr-2">
                    {conv.lastMessage.direccion === "OUTBOUND" ? "Tú: " : ""}
                    {conv.lastMessage.texto}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="bg-green-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col bg-slate-950/50">
        {activeConversation ? (
          <>
            <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="bg-slate-800 rounded-full p-2">
                  <User className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-200">{activeConversation.nombrePerfil}</h2>
                  <p className="text-xs text-slate-400">+{activeConversation.telefono}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 text-xs font-medium">
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 p-6 overflow-y-auto space-y-4"
            >
              {activeConversation.mensajes.map((msg: any) => {
                const isMe = msg.direccion === "OUTBOUND"
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div 
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                        isMe 
                          ? "bg-slate-700 text-slate-100 rounded-br-none" 
                          : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.texto}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {format(new Date(msg.createdAt), "dd MMM HH:mm", { locale: es })}
                      </span>
                      {isMe && (
                        <CheckCircle2 className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <form onSubmit={handleSend} className="flex gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Escribe un mensaje de WhatsApp..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  disabled={sendMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sendMutation.isPending}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl px-5 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                >
                  {sendMutation.isPending ? (
                    <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-slate-700" />
            </div>
            <div>
              <p className="font-medium text-slate-300">Selecciona una conversación</p>
              <p className="text-sm mt-1">Elige un contacto de la lista para ver los mensajes y responder por WhatsApp.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

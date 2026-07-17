"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface Msg {
  role: "user" | "assistant"
  content: string
}

export function SupportBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "¡Hola! Soy el asistente de soporte de MedSysVE. ¿En qué te ayudo?\n\nPuedo contarte sobre tu plan, diagnosticar errores comunes, o explicarte cómo usar el sistema. No tengo acceso a datos de pacientes.",
    },
  ])
  const [input, setInput] = useState("")
  const [pending, setPending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || pending) return
    setInput("")
    const next: Msg[] = [...messages, { role: "user", content: text }]
    setMessages(next)
    setPending(true)
    try {
      const res = await fetch("/api/support-bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages([
          ...next,
          {
            role: "assistant",
            content:
              "Lo siento, no pude procesar tu mensaje en este momento. Por favor contacta a yoguitech@gmail.com.",
          },
        ])
      } else {
        setMessages([
          ...next,
          { role: "assistant", content: data.reply ?? "Sin respuesta." },
        ])
      }
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Error de conexión. Inténtalo de nuevo o escribe a yoguitech@gmail.com.",
        },
      ])
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar soporte" : "Abrir soporte"}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-2xl shadow-amber-500/30 transition-colors"
      >
        {open ? (
          <span aria-hidden className="text-2xl leading-none">×</span>
        ) : (
          <span aria-hidden className="text-xl">💬</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Chat de soporte MedSysVE"
          className="fixed bottom-20 right-4 md:bottom-24 md:right-6 z-40 w-[min(420px,calc(100vw-2rem))] h-[min(560px,calc(100vh-8rem))] rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur shadow-2xl shadow-black/40 flex flex-col"
        >
          <header className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-base">
              🤖
            </span>
            <div className="flex-1 leading-tight">
              <p className="text-sm font-semibold text-white">Asistente MedSysVE</p>
              <p className="text-[10px] text-emerald-400 uppercase tracking-widest">
                ● En línea — solo lectura
              </p>
            </div>
          </header>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-amber-500 text-slate-900"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-400 rounded-2xl px-4 py-2 text-xs italic">
                  Pensando…
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            className="border-t border-slate-800 p-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              disabled={pending}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            <Button type="submit" disabled={pending || !input.trim()} size="sm">
              Enviar
            </Button>
          </form>
          <p className="text-[10px] text-slate-600 px-3 pb-2 text-center">
            El bot no accede a datos de pacientes. Para soporte humano:{" "}
            <a className="text-amber-400 underline" href="mailto:yoguitech@gmail.com">
              yoguitech@gmail.com
            </a>
          </p>
        </div>
      )}
    </>
  )
}
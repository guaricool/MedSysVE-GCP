"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { KeyRound, X } from "lucide-react"
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"

interface Props {
  staffId: string
  staffName: string
}

export function StaffPinReset({ staffId, staffName }: Props) {
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState("")
  const [confirm, setConfirm] = useState("")
  const [msg, setMsg] = useState<string | null>(null)

  const resetPin = (trpc.staff as any).resetPin.useMutation({
    onSuccess: () => {
      setMsg("PIN actualizado correctamente.")
      setPin("")
      setConfirm("")
      setTimeout(() => { setOpen(false); setMsg(null) }, 2000)
    },
    onError: (err: { message: string }) => setMsg(err.message),
  })

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-200"
        title="Cambiar PIN"
      >
        <KeyRound size={12} />
        PIN
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-white">Cambiar PIN — {staffName}</p>
          <button onClick={() => { setOpen(false); setMsg(null) }} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          <PasswordInput
            placeholder="Nuevo PIN (mín 6 dígitos)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white"
          />
          <PasswordInput
            placeholder="Confirmar PIN"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        {msg && (
          <p className={`text-xs ${msg.includes("correctamente") ? "text-green-400" : "text-red-400"}`}>
            {msg}
          </p>
        )}
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={pin.length < 6 || pin !== confirm || resetPin.isPending}
          onClick={() => resetPin.mutate({ id: staffId, newPin: pin })}
        >
          {resetPin.isPending ? "Guardando..." : "Guardar nuevo PIN"}
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { toast } from "sonner"
import { Bell, Loader2 } from "lucide-react"

export function SendReminderButton({ doctorId, doctorName }: { doctorId: string, doctorName: string }) {
  const [loading, setLoading] = useState(false)
  const utils = trpc.useUtils()

  const sendReminder = trpc.admin.sendPaymentReminder.useMutation({
    onSuccess: () => {
      toast.success(`Recordatorio enviado a ${doctorName}`)
      setLoading(false)
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`)
      setLoading(false)
    }
  })

  return (
    <button
      onClick={() => {
        setLoading(true)
        sendReminder.mutate({ doctorId })
      }}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 rounded text-xs font-medium transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
      Avisar
    </button>
  )
}

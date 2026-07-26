"use client"

import { useState } from "react"
import { Sparkles, Mic, CheckCircle, Zap, X, ShieldCheck, ArrowRight, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc-client"
import { useRouter } from "next/navigation"

interface Props {
  isOpen: boolean
  onClose: () => void
  onActivated?: () => void
}

export function VoiceAddonUpsellModal({ isOpen, onClose, onActivated }: Props) {
  const router = useRouter()
  const [isActivating, setIsActivating] = useState(false)
  const toggleAddon = trpc.doctor.toggleVoiceScribeAddon.useMutation()
  const utils = trpc.useUtils()

  if (!isOpen) return null

  const handleActivate = async () => {
    setIsActivating(true)
    try {
      await toggleAddon.mutateAsync()
      await utils.doctor.hasVoiceScribeAddon.invalidate()
      if (onActivated) onActivated()
      onClose()
    } catch (err) {
      console.error("Error activating addon:", err)
      router.push("/doctor/suscripcion")
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 relative">
        {/* Top Glow Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-purple-500 via-sky-400 to-emerald-400" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center space-y-6">
          {/* Icon Badge */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-emerald-500 p-0.5 shadow-xl flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-purple-300">
              <Mic className="w-8 h-8 animate-pulse text-emerald-400" />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Módulo Add-on Pro para Doctores
            </span>
            <h2 className="text-2xl font-black text-white">
              Escriba Médico IA por Voz
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              Transforma la consulta en vivo. La IA escucha tus conversaciones con el paciente, filtra comentarios informales y autocompleta la historia médica SOAP en tiempo real.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-200">
                <strong className="text-white">Auto-llenado Manos Libres:</strong> Motivo, Historia Clínica, Examen Físico y Plan se escriben solos mientras hablas.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-200">
                <strong className="text-white">Filtro de Ruido Social:</strong> Descarta charlas sobre clima, mascotas o viajes de forma transparente.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-200">
                <strong className="text-white">Ahorro de Tiempo:</strong> Ahorra entre 10 y 15 minutos por paciente en cada consulta.
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-emerald-950/40 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase tracking-wider text-purple-300 font-bold block">
                Suscripción Add-on Mensual:
              </span>
              <span className="text-2xl font-black text-white">$10.00 <span className="text-xs font-normal text-slate-400">USD / mes</span></span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full">
              ⚡ Acceso Ilimitado
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleActivate}
              disabled={isActivating}
              className="w-full bg-gradient-to-r from-purple-600 via-sky-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold text-sm py-6 rounded-xl shadow-lg transition-all"
            >
              {isActivating ? (
                "Activando Módulo..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4 fill-white" /> Activar Add-on por Voz por $10/mes <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Continuar con llenado manual de la consulta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

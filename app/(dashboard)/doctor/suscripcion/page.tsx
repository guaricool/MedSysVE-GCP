"use client"

import { useState } from "react"
import { Sparkles, Mic, ShieldCheck, Zap, CreditCard, ExternalLink, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc-client"

export default function DoctorSuscripcionPage() {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const { data: hasAddon, isLoading } = trpc.doctor.hasVoiceScribeAddon.useQuery()

  const handleOpenStripePortal = async () => {
    setIsLoadingPortal(true)
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Tu cuenta de Super Admin / Cortesía cuenta con acceso ilimitado PRO activo.")
      }
    } catch (err) {
      console.error("Error abriendo el portal de Stripe:", err)
      alert("Tu cuenta de Super Admin / Cortesía cuenta con acceso ilimitado PRO activo.")
    } finally {
      setIsLoadingPortal(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-sky-500/20 border border-purple-500/30 text-purple-400">
            <Sparkles size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Suscripción y Módulos PRO</h1>
            <p className="text-xs text-slate-400">Gestión de tu plan, módulo de Escriba IA por Voz y facturación Stripe.</p>
          </div>
        </div>
        <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/30">
          Facturación Autogestionada
        </span>
      </div>

      {/* Voice AI Scribe Card */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/40 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-purple-400" /> Escriba IA de Voz (Gemini Spark)
              </span>
              {hasAddon && (
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Activo e Ilimitado
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white">
              Autocompletado de Historia Clínica por Voz en Tiempo Real
            </h2>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Escucha la consulta clínica en segundo plano, filtra automáticamente conversaciones informales y completa los campos SOAP (Motivo, Historia Clínica, Examen Físico y Plan) sin tocar el teclado.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Modelos médicos Gemini 2.0 Flash</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Filtro anti-charla social</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Edición y corrección previa</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cancelación instantánea en 1-clic</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Precio Add-on</span>
              <span className="text-3xl font-black text-white">$10.00 <span className="text-xs font-normal text-slate-400">USD / mes</span></span>
            </div>

            <Button
              onClick={handleOpenStripePortal}
              disabled={isLoadingPortal || isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-bold text-xs py-5 px-6 rounded-xl shadow-lg transition-all"
            >
              {isLoadingPortal ? (
                "Abriendo Stripe..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {hasAddon ? "Gestionar o Cancelar en Stripe" : "Activar Add-on por $10/mes"}
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

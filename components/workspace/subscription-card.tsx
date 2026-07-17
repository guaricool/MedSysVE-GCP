"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CreditCard, AlertCircle, ExternalLink, Check } from "lucide-react"
import { trpc } from "@/lib/trpc-client"

/**
 * SubscriptionCard — sección en Configuración del consultorio para gestionar
 * la suscripción a MedSysVE.
 */
export function SubscriptionCard() {
  const { data: profile } = trpc.doctor.myProfile.useQuery()
  const utils = trpc.useUtils()
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation()
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  // isPaid = tiene stripeSubscriptionId activa (lo que el webhook escribe en
  // Doctor tras checkout.session.completed). NO usar billingStatus porque
  // nunca se setea — bug histórico.
  const isPaid = Boolean(profile?.stripeSubscriptionId)
  const planLabel = isPaid ? "Premium" :
                     profile?.plan === "trial" ? "Trial" : "Free"

  // Detectar ?checkout=success&session_id=... desde el redirect post-pago.
  // El webhook de Stripe puede tardar 1-3s en escribir la subscription; hacemos
  // refetch agresivo durante 10s para que el card pase de "Free" a "Premium".
  useEffect(() => {
    const checkoutStatus = searchParams?.get("checkout")
    const sessionId = searchParams?.get("session_id")
    if (checkoutStatus === "success" && sessionId) {
      setSuccessMessage("¡Suscripción activada! Procesando…")
      let attempts = 0
      const interval = setInterval(async () => {
        attempts++
        await utils.doctor.myProfile.invalidate()
        const fresh = utils.doctor.myProfile.getData()
        if (fresh?.stripeSubscriptionId || attempts >= 10) {
          clearInterval(interval)
          if (fresh?.stripeSubscriptionId) {
            setSuccessMessage("¡Suscripción activada! Gracias por confiar en MedSysVE.")
          } else {
            setSuccessMessage("Pago recibido. La activación puede tardar unos segundos más.")
          }
          // Limpiar URL para no volver a disparar el efecto
          router.replace("/workspace", { scroll: false })
        }
      }, 1000)
      return () => clearInterval(interval)
    } else if (checkoutStatus === "cancel") {
      setError("Cancelaste el checkout. No se realizó ningún cargo.")
      router.replace("/workspace", { scroll: false })
    }
  }, [searchParams, router, utils])

  async function handleManage() {
    setOpening(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Función disponible próximamente.")
      }
      const { url } = await res.json()
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido.")
    } finally {
      setOpening(false)
    }
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-amber-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Suscripción
          </h2>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
          isPaid
            ? "border-emerald-700 bg-emerald-900/30 text-emerald-300"
            : "border-slate-700 bg-slate-800 text-slate-400"
        }`}>
          {planLabel}
        </span>
      </div>

      <p className="text-xs text-slate-500">
        {isPaid
          ? "Tu suscripción está activa. Puedes cambiar de plan, actualizar el método de pago o cancelar desde el portal de Stripe."
          : "Estás en el plan Free. Upgrade a Individual ($25/mes) o Clínica ($60/mes con 2 médicos) para desbloquear todas las funciones."}
      </p>

      {successMessage && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-800/50 bg-emerald-950/30 p-2 text-xs text-emerald-300">
          <Check size={14} className="mt-0.5 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!isPaid && (
          <button
            type="button"
            disabled={opening || checkoutMutation.isPending}
            onClick={async () => {
              if (!profile?.id) return;
              try {
                setOpening(true)
                const res = await checkoutMutation.mutateAsync({
                  priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY || "",
                  entityType: "doctor",
                  entityId: profile.id
                })
                window.location.href = res.url
              } catch (e) {
                setError(e instanceof Error ? e.message : "Error al iniciar el pago")
                setOpening(false)
              }
            }}
            className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 disabled:opacity-50"
          >
            <Check size={14} />
            {checkoutMutation.isPending ? "Redirigiendo..." : "Suscribirse a Plan Premium ($25/mes)"}
          </button>
        )}
        {isPaid && (
          <>
            <button
              type="button"
              onClick={handleManage}
              disabled={opening}
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              <ExternalLink size={14} />
              {opening ? "Abriendo…" : "Gestionar suscripción"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("¿Cancelar la suscripción? Tu cuenta seguirá activa hasta el final del período pagado.")) {
                  handleManage()
                }
              }}
              disabled={opening}
              className="inline-flex items-center gap-2 rounded-md border border-red-800 bg-red-950/20 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-950/40 disabled:opacity-50"
            >
              Cancelar suscripción
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-amber-800/50 bg-amber-950/30 p-2 text-xs text-amber-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <p className="text-[10px] text-slate-600">
        El portal de Stripe permite cambiar método de pago, descargar facturas
        y cancelar. Los pagos recurrentes se procesan en USD. Para pagos en
        bolívares (transferencia o PagoMóvil), escribinos a yoguitech@gmail.com.
      </p>
    </section>
  )
}

"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc-client"
import { MessageSquare, Mail } from "lucide-react"

export default function PortalLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [portalPassword, setPortalPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Verification steps state
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [userId, setUserId] = useState("")
  const [intentId, setIntentId] = useState("")
  const [method, setMethod] = useState<"WHATSAPP" | "EMAIL" | null>(null)
  const [codigo, setCodigo] = useState("")
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const checkStatusMutation = trpc.marketplace.checkPortalUserStatus.useMutation()
  const verifyInitMutation = trpc.marketplace.initiateVerification.useMutation()
  const verifySubmitMutation = trpc.marketplace.verifyOtp.useMutation()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // 1. Check user status first to see if they are verified
      const status = await checkStatusMutation.mutateAsync({ identifier: email })
      
      if (status.exists && !status.isVerified) {
        setUserId(status.userId ?? "")
        setStep(2)
        setLoading(false)
        return
      }

      // 2. If verified (or doesn't exist yet, which will fail credentials signin normally), proceed with login
      const res = await signIn("portal", { email, portalPassword, redirect: false })
      setLoading(false)
      if (res?.error) {
        setError("Credenciales inválidas")
      } else {
        router.push("/portal")
      }
    } catch (err: any) {
      setLoading(false)
      setError(err.message || "Error al iniciar sesión.")
    }
  }

  async function onMethodSelect(selectedMethod: "WHATSAPP" | "EMAIL") {
    try {
      setError("")
      setMethod(selectedMethod)
      const res = await verifyInitMutation.mutateAsync({
        userId,
        method: selectedMethod
      })
      setIntentId(res.intentId)
      setCodigo(res.codigo)
      setStep(3)

      if (selectedMethod === "WHATSAPP") {
        const waUrl = `https://wa.me/584244967367?text=${encodeURIComponent(res.codigo)}`
        window.open(waUrl, "_blank", "noopener,noreferrer")
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar verificación.")
    }
  }

  async function onVerifySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isVerifying) return
    setIsVerifying(true)
    setError("")
    
    try {
      await verifySubmitMutation.mutateAsync({
        intentId,
        otp
      })
      // Verification successful, log in automatically
      const res = await signIn("portal", { email, portalPassword, redirect: false })
      if (res?.error) {
        setError("Verificado exitosamente. Inicie sesión para continuar.")
        setStep(1)
        setIsVerifying(false)
      } else {
        router.push("/portal")
      }
    } catch (err: any) {
      setIsVerifying(false)
      setError(err.message || "Código incorrecto.")
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-sm">
      {step === 1 && (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl"
        >
          <h2 className="text-base font-semibold text-white">Iniciar sesión — Portal del Paciente</h2>
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-slate-800 border-slate-700 text-white"
          />
          <PasswordInput
            placeholder="Contraseña"
            value={portalPassword}
            onChange={(e) => setPortalPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="bg-slate-800 border-slate-700 text-white"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          
          <div className="text-center pt-2 border-t border-slate-800 mt-4">
            <Link href="/portal/register" className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors">
              ¿No tienes cuenta? Regístrate aquí
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl text-center">
          <h2 className="text-xl font-bold text-white">Verifica tu cuenta</h2>
          <p className="text-red-400 text-sm font-medium">No has verificado tu cuenta aún.</p>
          <p className="text-slate-400 text-sm">
            Para proteger tu historial médico, necesitamos verificar tu identidad. ¿Por dónde deseas recibir el código?
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2 border-green-900 hover:border-green-500 hover:bg-green-950/30 bg-transparent text-white"
              onClick={() => onMethodSelect("WHATSAPP")}
              disabled={verifyInitMutation.isPending}
            >
              <MessageSquare className="w-8 h-8 text-green-500" />
              <span>WhatsApp</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2 border-blue-900 hover:border-blue-500 hover:bg-blue-950/30 bg-transparent text-white"
              onClick={() => onMethodSelect("EMAIL")}
              disabled={verifyInitMutation.isPending}
            >
              <Mail className="w-8 h-8 text-blue-500" />
              <span>Correo</span>
            </Button>
          </div>
          
          {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
          
          <button 
            onClick={() => setStep(1)} 
            className="text-xs text-slate-400 hover:text-slate-300 hover:underline block mx-auto mt-4"
          >
            Volver a iniciar sesión
          </button>
        </div>
      )}

      {step === 3 && (
        <form
          onSubmit={onVerifySubmit}
          className="space-y-6 rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl text-center"
        >
          <h2 className="text-xl font-bold text-white">Introduce el código</h2>
          
          {method === "WHATSAPP" ? (
            <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700 text-left space-y-2">
              <p className="text-sm text-slate-300">
                1. Envía un WhatsApp al{" "}
                <a
                  href={`https://wa.me/584244967367?text=${encodeURIComponent(codigo)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 underline hover:text-green-300 font-bold"
                >
                  +58 424-4967367
                </a>{" "}
                con el texto:
              </p>
              <div className="bg-black/50 p-3 rounded font-mono text-center text-green-400 text-lg tracking-widest font-bold">
                {codigo}
              </div>
              <p className="text-sm text-slate-300">
                2. El bot te responderá con un código de 6 dígitos. Introdúcelo abajo.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Hemos enviado un código a <strong>{email}</strong>. Por favor, revísalo (incluyendo la carpeta de SPAM).
            </p>
          )}

          <div className="space-y-2">
            <Input
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest font-mono"
            />
          </div>

          {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
          
          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? "Verificando..." : "Verificar y Entrar"}
          </Button>

          <button 
            type="button"
            onClick={() => setStep(2)} 
            className="text-xs text-slate-400 hover:text-slate-300 hover:underline block mx-auto"
          >
            Cambiar método de envío
          </button>
        </form>
      )}
    </div>
  )
}

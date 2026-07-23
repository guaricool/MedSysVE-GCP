"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

type Step = "request" | "verify" | "reset" | "done"

function parseTRPCError(message: string): string {
  try {
    const parsed = JSON.parse(message)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
      return parsed.map((e: any) => e.message).join(", ")
    }
  } catch {
    // not JSON
  }
  return message
}

export function ForgotPasswordForm() {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null)
  const [step, setStep] = useState<Step>("request")
  const [otpExpiresIn, setOtpExpiresIn] = useState(0)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (otpExpiresIn <= 0 && resendCooldown <= 0) return
    const t = setInterval(() => {
      setOtpExpiresIn((v) => (v > 0 ? v - 1 : 0))
      setResendCooldown((v) => (v > 0 ? v - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [otpExpiresIn, resendCooldown])

  const requestOtp = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      setStep("verify")
      setOtpExpiresIn(data.expiresInSeconds)
      setResendCooldown(60)
      setError("")
    },
    onError: (e) => setError(parseTRPCError(e.message)),
  })

  const verifyOtp = trpc.auth.verifyPasswordResetOtp.useMutation({
    onSuccess: (data) => {
      setVerifiedToken(data.verifiedToken)
      setStep("reset")
      setError("")
    },
    onError: (e) => setError(parseTRPCError(e.message)),
  })

  const confirmReset = trpc.auth.confirmPasswordReset.useMutation({
    onSuccess: () => {
      setSuccess(true)
      setStep("done")
    },
    onError: (e) => setError(parseTRPCError(e.message)),
  })

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!emailValid) {
      setError("Ingresa un correo válido.")
      return
    }
    requestOtp.mutate({ email: email.trim().toLowerCase() })
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (otpCode.length !== 6) {
      setError("El código debe ser de 6 dígitos.")
      return
    }
    verifyOtp.mutate({ email: email.trim().toLowerCase(), code: otpCode })
  }

  const handleResend = () => {
    if (resendCooldown > 0) return
    requestOtp.mutate({ email: email.trim().toLowerCase() })
  }

  const handleReset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    if (!verifiedToken) {
      setError("Verifica el código antes de cambiar la contraseña.")
      return
    }
    const fd = new FormData(e.currentTarget)
    const newPassword = fd.get("newPassword") as string
    const confirm = fd.get("confirm") as string
    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.")
      return
    }
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    confirmReset.mutate({ verifiedToken, newPassword })
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  if (success) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Contraseña restablecida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="text-emerald-300 text-sm">
            ✓ Tu contraseña fue cambiada con éxito.
          </div>
          <Link
            href="/login"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-md px-6 py-2 text-sm"
          >
            Iniciar sesión
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Recuperar contraseña</CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          Si tu correo está registrado, te enviaremos un código de 6 dígitos. Revisa tu bandeja
          (y spam). El código caduca en 15 minutos.
        </p>
      </CardHeader>
      <CardContent>
        {/* Step 1: Email */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step !== "request" ? "bg-emerald-500 text-white" : "bg-amber-500 text-slate-900"
              }`}
            >
              1
            </span>
            <span className="text-sm font-semibold text-slate-200">Tu correo</span>
          </div>
          {step === "request" ? (
            <form onSubmit={handleRequest} className="flex gap-2">
              <Input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={requestOtp.isPending}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Button type="submit" disabled={!emailValid || requestOtp.isPending}>
                {requestOtp.isPending ? "Enviando…" : "Enviar código"}
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm">
              <span className="text-slate-300">
                Código enviado a <span className="font-mono text-amber-300">{email}</span>
              </span>
              {otpExpiresIn > 0 ? (
                <span className="text-xs text-slate-400">
                  Caduca en <span className="font-mono text-amber-300">{formatTime(otpExpiresIn)}</span>
                </span>
              ) : (
                <span className="text-xs text-red-400">Expirado</span>
              )}
            </div>
          )}
        </div>

        {/* Step 2: 6-digit code */}
        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-3 mb-5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-900">
                2
              </span>
              <span className="text-sm font-semibold text-slate-200">Ingresa el código</span>
            </div>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(v) => setOtpCode(v.replace(/\D/g, "").slice(0, 6))}
                disabled={verifyOtp.isPending}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={resendCooldown > 0 || requestOtp.isPending}
                className="text-slate-400 hover:text-amber-300"
              >
                {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Reenviar código"}
              </Button>
              <Button type="submit" disabled={otpCode.length !== 6 || verifyOtp.isPending}>
                {verifyOtp.isPending ? "Verificando…" : "Verificar"}
              </Button>
            </div>
          </form>
        )}

        {step === "reset" && (
          <div className="mb-5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            ✓ Código verificado. Ahora elige tu nueva contraseña.
          </div>
        )}

        {/* Step 3: New password */}
        {step === "reset" && (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-900">
                3
              </span>
              <span className="text-sm font-semibold text-slate-200">Nueva contraseña</span>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Nueva contraseña</Label>
              <PasswordInput
                name="newPassword"
                required
                minLength={8}
                autoComplete="new-password"
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500">
                Mínimo 8 caracteres, con mayúsculas, minúsculas, números y un símbolo.
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Confirma la contraseña</Label>
              <PasswordInput
                name="confirm"
                required
                minLength={8}
                autoComplete="new-password"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" disabled={confirmReset.isPending} className="w-full">
              {confirmReset.isPending ? "Cambiando…" : "Cambiar contraseña"}
            </Button>
          </form>
        )}

        {error && step !== "reset" && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-slate-400 text-sm">
          <Link href="/login" className="text-blue-400 hover:underline">
            ← Volver a iniciar sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
// Removed unused Select import
import { MessageSquare, Mail } from "lucide-react"
import { CountryCodeSelect } from "@/components/ui/country-code-select"

export default function PortalRegisterPage() {
  const router = useRouter()
  
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  // Step 1 State
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [codigoPais, setCodigoPais] = useState("+58")
  const [telefonoLocal, setTelefonoLocal] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [tipoIdentificacion, setTipoIdentificacion] = useState<"CEDULA_V" | "CEDULA_E" | "PASAPORTE" | "">("")
  const [numeroIdentificacion, setNumeroIdentificacion] = useState("")
  const [error, setError] = useState("")

  // Step 2 & 3 State
  const [userId, setUserId] = useState("")
  const [intentId, setIntentId] = useState("")
  const [method, setMethod] = useState<"WHATSAPP" | "EMAIL" | null>(null)
  const [codigo, setCodigo] = useState("")
  const [otp, setOtp] = useState("")

  const registerMutation = trpc.marketplace.registerPortalUser.useMutation()
  const verifyInitMutation = trpc.marketplace.initiateVerification.useMutation()
  const verifySubmitMutation = trpc.marketplace.verifyOtp.useMutation()

  async function onRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    
    // Password complexity check (minimum 10 chars, mixed case, digit)
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasDigit = /[0-9]/.test(password)
    if (password.length < 10 || !hasUpper || !hasLower || !hasDigit) {
      setError("La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula y un número.")
      return
    }

    try {
      const res = await registerMutation.mutateAsync({
        nombre,
        apellido,
        telefono: `${codigoPais}${telefonoLocal}`,
        email,
        password,
        tipoIdentificacion: tipoIdentificacion || undefined,
        numeroIdentificacion: numeroIdentificacion || undefined,
      })
      
      setUserId(res.userId)
      setStep(2)
    } catch (err: any) {
      setError(err.message || "Error al crear cuenta.")
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
    } catch (err: any) {
      setError(err.message || "Error al iniciar verificación.")
    }
  }

  async function onVerifySubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    
    try {
      await verifySubmitMutation.mutateAsync({
        intentId,
        otp
      })
      // Verification successful, redirect to login
      router.push("/portal/login?verified=true")
    } catch (err: any) {
      setError(err.message || "Código incorrecto.")
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-md">
      {step === 1 && (
        <form
          onSubmit={onRegisterSubmit}
          className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl"
        >
          <h2 className="text-xl font-bold text-white mb-2">Crear Cuenta - MedSysVE</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Nombre</label>
              <Input
                placeholder="Juan"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Apellido</label>
              <Input
                placeholder="Pérez"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-[100px_1fr] gap-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Tipo</label>
              <select 
                value={tipoIdentificacion} 
                onChange={(e) => setTipoIdentificacion(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm h-10"
              >
                <option value="">Tipo</option>
                <option value="CEDULA_V">V-</option>
                <option value="CEDULA_E">E-</option>
                <option value="PASAPORTE">P-</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Número de Identificación</label>
              <Input
                placeholder="12345678"
                value={numeroIdentificacion}
                onChange={(e) => setNumeroIdentificacion(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Teléfono (con código de país)</label>
            <div className="flex gap-2">
              <CountryCodeSelect value={codigoPais} onChange={setCodigoPais} />
              <Input
                placeholder="4141234567"
                value={telefonoLocal}
                onChange={(e) => setTelefonoLocal(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Correo Electrónico</label>
            <Input
              type="email"
              placeholder="juan@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Contraseña</label>
            <PasswordInput
              placeholder="Min 10 chars, mayúscula, número"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
          
          <Button type="submit" className="w-full mt-4" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>
          
          <div className="text-center mt-4">
            <a href="/portal/login" className="text-sm text-blue-400 hover:underline">
              ¿Ya tienes cuenta? Inicia sesión
            </a>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl text-center">
          <h2 className="text-xl font-bold text-white">Verifica tu cuenta</h2>
          <p className="text-slate-400 text-sm">
            Para proteger tu historial médico, necesitamos verificar tu identidad. ¿Por dónde prefieres recibir el código?
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2 border-green-900 hover:border-green-500 hover:bg-green-950/30"
              onClick={() => onMethodSelect("WHATSAPP")}
              disabled={verifyInitMutation.isPending}
            >
              <MessageSquare className="w-8 h-8 text-green-500" />
              <span className="text-white">WhatsApp</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2 border-blue-900 hover:border-blue-500 hover:bg-blue-950/30"
              onClick={() => onMethodSelect("EMAIL")}
              disabled={verifyInitMutation.isPending}
            >
              <Mail className="w-8 h-8 text-blue-500" />
              <span className="text-white">Correo</span>
            </Button>
          </div>
          
          {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
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
                1. Envía un WhatsApp al <strong>+1234567890</strong> con el texto:
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
          
          <Button type="submit" className="w-full" disabled={verifySubmitMutation.isPending}>
            {verifySubmitMutation.isPending ? "Verificando..." : "Verificar y Completar Registro"}
          </Button>
        </form>
      )}
    </div>
  )
}

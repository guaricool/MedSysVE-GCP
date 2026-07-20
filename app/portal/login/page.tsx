"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"

export default function PortalLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [portalPassword, setPortalPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await signIn("portal", { email, portalPassword, redirect: false })
    setLoading(false)
    if (res?.error) setError("Credenciales inválidas")
    else router.push("/portal")
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-12 max-w-sm space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-6"
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
  )
}

"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("error") === "IP_RESTRICTED") {
      setError("Acceso no permitido desde esta dirección IP.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const fd = new FormData(e.currentTarget)
      const email = ((fd.get("email") as string) ?? "").trim().toLowerCase()
      const password = (fd.get("password") as string) ?? ""

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      // In next-auth v5 beta, ok=true even on failure (HTTP 200 callback).
      // The real success indicator is the absence of result.error.
      if (result && !result.error) {
        // Force a hard refresh to /login so the server-side page.tsx handles role-based routing
        window.location.href = "/login"
      } else {
        setError("Email o contraseña incorrectos")
      }
    } catch {
      setError("Email o contraseña incorrectos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Iniciar Sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-slate-300">Email</Label>
            <Input name="email" type="email" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Contraseña / PIN</Label>
            <PasswordInput name="password" required autoComplete="current-password" className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-blue-400 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </Button>
          <p className="text-center text-slate-400 text-sm">
            ¿Eres doctor nuevo?{" "}
            <Link href="/register" className="text-blue-400 hover:underline">
              Regístrate
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

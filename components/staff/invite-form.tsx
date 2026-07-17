"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StaffRole } from "@prisma/client"

export function InviteForm() {
  const router = useRouter()
  const [error, setError] = useState("")

  const invite = trpc.staff.invite.useMutation({
    onSuccess: () => router.push("/doctor/staff"),
    onError: (e) => setError(e.message),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    invite.mutate({
      cedula: fd.get("cedula") as string,
      nombre: fd.get("nombre") as string,
      apellido: fd.get("apellido") as string,
      email: fd.get("email") as string,
      pin: fd.get("pin") as string,
      rol: fd.get("rol") as StaffRole,
    })
  }

  return (
    <Card className="bg-slate-900 border-slate-800 w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-white">Agregar Miembro del Equipo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Nombre</Label>
              <Input
                name="nombre"
                required
                className="bg-slate-800 border-slate-700 text-white w-full"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Apellido</Label>
              <Input
                name="apellido"
                required
                className="bg-slate-800 border-slate-700 text-white w-full"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Cédula</Label>
            <Input
              name="cedula"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Email</Label>
            <Input
              name="email"
              type="email"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">PIN de acceso (mín. 6 caracteres)</Label>
            <PasswordInput
              name="pin"
              minLength={6}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Rol</Label>
            <select
              name="rol"
              required
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
            >
              <option value="SECRETARY">Secretaria</option>
              <option value="ASSISTANT">Asistente</option>
              <option value="NURSE">Enfermera</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={invite.isPending}>
            {invite.isPending ? "Guardando..." : "Agregar miembro"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

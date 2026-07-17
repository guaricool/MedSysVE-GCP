"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"

interface Props {
  initialData: {
    nombre: string
    apellido: string
    telefono: string | null
    email: string | null
    numeroIdentificacion: string | null
  }
}

export function PortalPerfilClient({ initialData }: Props) {
  const [telefono, setTelefono] = useState(initialData.telefono ?? "")
  const [email, setEmail] = useState(initialData.email ?? "")
  const [contactMsg, setContactMsg] = useState("")
  const [contactErr, setContactErr] = useState("")

  const [currentPass, setCurrentPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [passMsg, setPassMsg] = useState("")
  const [passErr, setPassErr] = useState("")

  const updateProfile = (trpc.portal as any).updateProfile.useMutation({
    onSuccess: () => {
      setContactMsg("Datos actualizados correctamente.")
      setContactErr("")
    },
    onError: (e: Error) => {
      setContactErr(e.message)
      setContactMsg("")
    },
  })

  const changePassword = (trpc.portal as any).changePassword.useMutation({
    onSuccess: () => {
      setPassMsg("Contraseña cambiada exitosamente.")
      setPassErr("")
      setCurrentPass("")
      setNewPass("")
      setConfirmPass("")
    },
    onError: (e: Error) => {
      setPassErr(e.message)
      setPassMsg("")
    },
  })

  function handleContactSave() {
    setContactMsg("")
    setContactErr("")
    updateProfile.mutate({ telefono: telefono || undefined, email: email || undefined })
  }

  function handlePasswordChange() {
    setPassMsg("")
    setPassErr("")
    if (newPass !== confirmPass) {
      setPassErr("Las contraseñas no coinciden.")
      return
    }
    if (newPass.length < 6) {
      setPassErr("La contraseña debe tener al menos 6 caracteres.")
      return
    }
    changePassword.mutate({ currentPassword: currentPass, newPassword: newPass })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{initialData.nombre} {initialData.apellido}</h1>
        {initialData.numeroIdentificacion && (
          <p className="text-sm text-slate-400 mt-0.5">C.I.: {initialData.numeroIdentificacion}</p>
        )}
      </div>

      {/* Contact section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">Datos de contacto</h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Teléfono</Label>
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 04141234567"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Correo electrónico</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
        <Button
          onClick={handleContactSave}
          disabled={updateProfile.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {updateProfile.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
        {contactMsg && <p className="text-sm text-emerald-400">{contactMsg}</p>}
        {contactErr && <p className="text-sm text-red-400">{contactErr}</p>}
      </div>

      {/* Password section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">Cambiar contraseña</h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Contraseña actual</Label>
            <PasswordInput
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              autoComplete="current-password"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Nueva contraseña</Label>
            <PasswordInput
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Confirmar nueva contraseña</Label>
            <PasswordInput
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              autoComplete="new-password"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
        <Button
          onClick={handlePasswordChange}
          disabled={changePassword.isPending || !currentPass || !newPass || !confirmPass}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {changePassword.isPending ? "Cambiando..." : "Cambiar contraseña"}
        </Button>
        {passMsg && <p className="text-sm text-emerald-400">{passMsg}</p>}
        {passErr && <p className="text-sm text-red-400">{passErr}</p>}
      </div>
    </div>
  )
}

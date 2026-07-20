"use client"

import { useState, useEffect } from "react"
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

  // Global Patient Profile states
  const { data: globalProfile, refetch: refetchGlobal } = trpc.portal.getGlobalProfile.useQuery()
  const [grupoSanguineo, setGrupoSanguineo] = useState("")
  const [alergias, setAlergias] = useState("")
  const [antecedentes, setAntecedentes] = useState("")
  const [medicalMsg, setMedicalMsg] = useState("")
  const [medicalErr, setMedicalErr] = useState("")

  useEffect(() => {
    if (globalProfile) {
      setGrupoSanguineo(globalProfile.grupoSanguineo || "")
      setAlergias(globalProfile.alergias ? globalProfile.alergias.join(", ") : "")
      setAntecedentes(globalProfile.antecedentes || "")
    }
  }, [globalProfile])

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

  const updateMedicalProfile = trpc.portal.updateGlobalProfile.useMutation({
    onSuccess: () => {
      setMedicalMsg("Datos médicos actualizados correctamente.")
      setMedicalErr("")
      refetchGlobal()
    },
    onError: (e: any) => {
      setMedicalErr(e.message)
      setMedicalMsg("")
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

  function handleMedicalSave() {
    setMedicalMsg("")
    setMedicalErr("")
    updateMedicalProfile.mutate({
      grupoSanguineo: grupoSanguineo || null,
      alergias: alergias ? alergias.split(",").map((s) => s.trim()).filter(Boolean) : [],
      antecedentes: antecedentes || null,
    })
  }

  function handlePasswordChange() {
    setPassMsg("")
    setPassErr("")
    if (newPass !== confirmPass) {
      setPassErr("Las contraseñas no coinciden.")
      return
    }
    if (newPass.length < 10) {
      setPassErr("La contraseña debe tener al menos 10 caracteres.")
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

      {/* Medical Info Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">Expediente Médico Global (EHR)</h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Grupo Sanguíneo</Label>
            <select
              value={grupoSanguineo}
              onChange={(e) => setGrupoSanguineo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm h-10"
            >
              <option value="">Selecciona tu tipo de sangre</option>
              <option value="O+">O Positivo (O+)</option>
              <option value="O-">O Negativo (O-)</option>
              <option value="A+">A Positivo (A+)</option>
              <option value="A-">A Negativo (A-)</option>
              <option value="B+">B Positivo (B+)</option>
              <option value="B-">B Negativo (B-)</option>
              <option value="AB+">AB Positivo (AB+)</option>
              <option value="AB-">AB Negativo (AB-)</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Alergias (separadas por comas)</Label>
            <Input
              value={alergias}
              onChange={(e) => setAlergias(e.target.value)}
              placeholder="Ej: Penicilina, AINEs, Polen"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Antecedentes Médicos Personales</Label>
            <textarea
              value={antecedentes}
              onChange={(e) => setAntecedentes(e.target.value)}
              placeholder="Describa aquí enfermedades preexistentes, cirugías, tratamientos crónicos, etc."
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <Button
          onClick={handleMedicalSave}
          disabled={updateMedicalProfile.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateMedicalProfile.isPending ? "Guardando..." : "Guardar datos médicos"}
        </Button>
        {medicalMsg && <p className="text-sm text-emerald-400">{medicalMsg}</p>}
        {medicalErr && <p className="text-sm text-red-400">{medicalErr}</p>}
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
          className="bg-blue-600 hover:bg-blue-700 text-white"
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
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {changePassword.isPending ? "Cambiando..." : "Cambiar contraseña"}
        </Button>
        {passMsg && <p className="text-sm text-emerald-400">{passMsg}</p>}
        {passErr && <p className="text-sm text-red-400">{passErr}</p>}
      </div>
    </div>
  )
}

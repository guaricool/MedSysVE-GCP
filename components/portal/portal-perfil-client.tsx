"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Shield, Plus, Check, X, Trash2, Heart, Activity, Syringe, ClipboardList } from "lucide-react"
import { BloodTypeSelector } from "@/components/ui/clinical/blood-type-selector"
import { AllergyListEditor } from "@/components/ui/clinical/allergy-list-editor"

const VACUNAS_VE = [
  "BCG",
  "Hepatitis B",
  "DPT (Difteria, Tosferina, Tétanos)",
  "Td (Tétanos + Difteria adultos)",
  "Polio (OPV)",
  "Polio (IPV)",
  "Hib (Haemophilus influenzae b)",
  "Rotavirus",
  "Neumococo",
  "SRP (Sarampión, Rubéola, Paperas)",
  "Varicela",
  "Hepatitis A",
  "Fiebre Amarilla",
  "VPH (Virus Papiloma Humano)",
  "Meningococo",
  "Influenza",
  "COVID-19",
  "Rabia",
  "Otra",
]

interface Allergy {
  sustancia: string
  reaccion: string
  gravedad: "LEVE" | "MODERADA" | "SEVERA"
}

interface Vaccine {
  id: string
  vacuna: string
  fechaAplicacion: string
  dosis: string
  lote: string
  proximaDosis: string
  aplicadoPor: string
  notas: string
}

interface Insurance {
  id: string
  provider: string
  numeroPoliza: string
  titular: string
  coberturaPct: number
  fechaVigencia: string
  notas: string
  activa: boolean
}

interface AntecedentesJson {
  personal?: {
    hipertension?: boolean
    diabetes?: boolean
    cardiopatia?: boolean
    asma?: boolean
    epilepsia?: boolean
    cancer?: boolean
    otros?: string
  }
  familiares?: {
    hipertension?: boolean
    diabetes?: boolean
    cardiopatia?: boolean
    otros?: string
  }
  habitos?: { fumador?: boolean; alcohol?: boolean; drogas?: boolean; otros?: string }
  quirurgicos?: string
  ginecologicos?: string
}

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
  // Contact States
  const [telefono, setTelefono] = useState(initialData.telefono ?? "")
  const [email, setEmail] = useState(initialData.email ?? "")
  const [contactMsg, setContactMsg] = useState("")
  const [contactErr, setContactErr] = useState("")

  // Password States
  const [currentPass, setCurrentPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [passMsg, setPassMsg] = useState("")
  const [passErr, setPassErr] = useState("")

  // Global Patient Profile states
  const { data: globalProfile, refetch: refetchGlobal } = trpc.portal.getGlobalProfile.useQuery()
  const [grupoSanguineo, setGrupoSanguineo] = useState("")
  const [alergias, setAlergias] = useState<Allergy[]>([])
  const [vacunas, setVacunas] = useState<Vaccine[]>([])
  const [seguros, setSeguros] = useState<Insurance[]>([])
  const [antecedentes, setAntecedentes] = useState<AntecedentesJson>({})

  const [medicalMsg, setMedicalMsg] = useState("")
  const [medicalErr, setMedicalErr] = useState("")

  // Form toggles
  const [showBloodForm, setShowBloodForm] = useState(false)
  const [showAllergyForm, setShowAllergyForm] = useState(false)
  const [showVaccineForm, setShowVaccineForm] = useState(false)
  const [showInsuranceForm, setShowInsuranceForm] = useState(false)
  const [showAntecedentesForm, setShowAntecedentesForm] = useState(false)

  // Subform inputs
  const [newBloodType, setNewBloodType] = useState("")
  
  const [allergyInput, setAllergyInput] = useState<Allergy>({
    sustancia: "",
    reaccion: "",
    gravedad: "LEVE"
  })

  const [vaccineInput, setVaccineInput] = useState({
    vacuna: "",
    otraVacuna: "",
    fechaAplicacion: new Date().toISOString().slice(0, 10),
    dosis: "",
    lote: "",
    proximaDosis: "",
    aplicadoPor: "",
    notas: "",
  })

  const [insuranceInput, setInsuranceInput] = useState({
    provider: "",
    numeroPoliza: "",
    titular: "",
    coberturaPct: 100,
    fechaVigencia: "",
    notas: "",
  })

  // Load and Parse Global Profile Data
  useEffect(() => {
    if (globalProfile) {
      const profile = globalProfile as any
      setGrupoSanguineo(profile.grupoSanguineo || "")
      setNewBloodType(profile.grupoSanguineo || "")

      // Parse Allergies
      const parsedAlergias = (profile.alergias || []).map((a: string) => {
        try {
          return JSON.parse(a) as Allergy
        } catch {
          return { sustancia: a, reaccion: "", gravedad: "LEVE" } as Allergy
        }
      })
      setAlergias(parsedAlergias)

      // Parse Vaccines
      const parsedVacunas = (profile.vacunas || []).map((v: string) => {
        try {
          return JSON.parse(v) as Vaccine
        } catch {
          return { id: Math.random().toString(), vacuna: v, fechaAplicacion: "", dosis: "", lote: "", proximaDosis: "", aplicadoPor: "", notas: "" } as Vaccine
        }
      })
      setVacunas(parsedVacunas)

      // Parse Insurances
      const parsedSeguros = (profile.seguros || []).map((s: string) => {
        try {
          return JSON.parse(s) as Insurance
        } catch {
          return { id: Math.random().toString(), provider: s, numeroPoliza: "", titular: "", coberturaPct: 100, fechaVigencia: "", notas: "", activa: true } as Insurance
        }
      })
      setSeguros(parsedSeguros)

      // Parse Medical History/Antecedentes
      if (globalProfile.antecedentes) {
        try {
          setAntecedentes(JSON.parse(globalProfile.antecedentes) as AntecedentesJson)
        } catch {
          setAntecedentes({ quirurgicos: globalProfile.antecedentes } as AntecedentesJson)
        }
      } else {
        setAntecedentes({})
      }
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

  // Mutation Wrapper Helpers
  function saveMedicalUpdate(patch: {
    grupoSanguineo?: string | null
    alergias?: Allergy[]
    vacunas?: Vaccine[]
    seguros?: Insurance[]
    antecedentes?: AntecedentesJson
  }) {
    setMedicalMsg("")
    setMedicalErr("")

    const finalBlood = patch.grupoSanguineo !== undefined ? patch.grupoSanguineo : (grupoSanguineo || null)
    const finalAlergias = (patch.alergias !== undefined ? patch.alergias : alergias).map(a => JSON.stringify(a))
    const finalVacunas = (patch.vacunas !== undefined ? patch.vacunas : vacunas).map(v => JSON.stringify(v))
    const finalSeguros = (patch.seguros !== undefined ? patch.seguros : seguros).map(s => JSON.stringify(s))
    const finalAntecedentes = JSON.stringify(patch.antecedentes !== undefined ? patch.antecedentes : antecedentes)

    updateMedicalProfile.mutate({
      grupoSanguineo: finalBlood,
      alergias: finalAlergias,
      vacunas: finalVacunas,
      seguros: finalSeguros,
      antecedentes: finalAntecedentes,
    })
  }

  // Action Handlers
  function saveBloodType() {
    saveMedicalUpdate({ grupoSanguineo: newBloodType })
    setShowBloodForm(false)
  }

  function handleAddAllergy() {
    if (!allergyInput.sustancia.trim()) return
    const updated = [...alergias, { ...allergyInput, sustancia: allergyInput.sustancia.trim() }]
    saveMedicalUpdate({ alergias: updated })
    setAllergyInput({ sustancia: "", reaccion: "", gravedad: "LEVE" })
    setShowAllergyForm(false)
  }

  function handleDeleteAllergy(index: number) {
    const updated = alergias.filter((_, i) => i !== index)
    saveMedicalUpdate({ alergias: updated })
  }

  function handleAddVaccine() {
    const name = vaccineInput.vacuna === "Otra" ? vaccineInput.otraVacuna : vaccineInput.vacuna
    if (!name.trim() || !vaccineInput.fechaAplicacion) return

    const newVac: Vaccine = {
      id: Math.random().toString(),
      vacuna: name.trim(),
      fechaAplicacion: vaccineInput.fechaAplicacion,
      dosis: vaccineInput.dosis,
      lote: vaccineInput.lote,
      proximaDosis: vaccineInput.proximaDosis,
      aplicadoPor: vaccineInput.aplicadoPor,
      notas: vaccineInput.notas,
    }

    const updated = [...vacunas, newVac]
    saveMedicalUpdate({ vacunas: updated })
    setVaccineInput({
      vacuna: "",
      otraVacuna: "",
      fechaAplicacion: new Date().toISOString().slice(0, 10),
      dosis: "",
      lote: "",
      proximaDosis: "",
      aplicadoPor: "",
      notas: "",
    })
    setShowVaccineForm(false)
  }

  function handleDeleteVaccine(id: string) {
    const updated = vacunas.filter((v) => v.id !== id)
    saveMedicalUpdate({ vacunas: updated })
  }

  function handleAddInsurance() {
    if (!insuranceInput.provider.trim() || !insuranceInput.numeroPoliza.trim()) return

    const newIns: Insurance = {
      id: Math.random().toString(),
      provider: insuranceInput.provider.trim(),
      numeroPoliza: insuranceInput.numeroPoliza.trim(),
      titular: insuranceInput.titular.trim(),
      coberturaPct: Number(insuranceInput.coberturaPct || 100),
      fechaVigencia: insuranceInput.fechaVigencia,
      notas: insuranceInput.notas,
      activa: true,
    }

    const updated = [...seguros, newIns]
    saveMedicalUpdate({ seguros: updated })
    setInsuranceInput({
      provider: "",
      numeroPoliza: "",
      titular: "",
      coberturaPct: 100,
      fechaVigencia: "",
      notas: "",
    })
    setShowInsuranceForm(false)
  }

  function handleToggleInsurance(id: string) {
    const updated = seguros.map((s) => s.id === id ? { ...s, activa: !s.activa } : s)
    saveMedicalUpdate({ seguros: updated })
  }

  function handleDeleteInsurance(id: string) {
    const updated = seguros.filter((s) => s.id !== id)
    saveMedicalUpdate({ seguros: updated })
  }

  // History checkbox change helpers
  function setPersonal(key: keyof NonNullable<AntecedentesJson["personal"]>, val: boolean | string) {
    setAntecedentes((d) => ({ ...d, personal: { ...d.personal, [key]: val } }))
  }
  function setFamiliares(key: keyof NonNullable<AntecedentesJson["familiares"]>, val: boolean | string) {
    setAntecedentes((d) => ({ ...d, familiares: { ...d.familiares, [key]: val } }))
  }
  function setHabitos(key: keyof NonNullable<AntecedentesJson["habitos"]>, val: boolean | string) {
    setAntecedentes((d) => ({ ...d, habitos: { ...d.habitos, [key]: val } }))
  }

  const CheckRow = ({
    label,
    checked,
    onChange,
  }: {
    label: string
    checked?: boolean
    onChange: (v: boolean) => void
  }) => (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-600 bg-slate-850 accent-blue-500"
      />
      {label}
    </label>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{initialData.nombre} {initialData.apellido}</h1>
        {initialData.numeroIdentificacion && (
          <p className="text-sm text-slate-400 mt-0.5">C.I.: {initialData.numeroIdentificacion}</p>
        )}
      </div>

      {medicalMsg && <div className="p-3 bg-emerald-950/40 text-emerald-400 rounded-md border border-emerald-900 text-sm">{medicalMsg}</div>}
      {medicalErr && <div className="p-3 bg-red-950/40 text-red-400 rounded-md border border-red-900 text-sm">{medicalErr}</div>}

      {/* 1. Grupo Sanguíneo Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Heart className="w-4 h-4 text-red-500" />
            Grupo Sanguíneo
          </h2>
          {!showBloodForm && (
            <button
              onClick={() => {
                setNewBloodType(grupoSanguineo)
                setShowBloodForm(true)
              }}
              className="text-xs text-blue-400 hover:underline"
            >
              {grupoSanguineo ? "Editar" : "Registrar"}
            </button>
          )}
        </div>

        {showBloodForm ? (
          <div className="space-y-3">
            <BloodTypeSelector value={newBloodType} onChange={setNewBloodType} />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={saveBloodType}
                disabled={updateMedicalProfile.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Guardar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowBloodForm(false)}
                className="text-slate-400"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p className={`text-sm font-semibold ${grupoSanguineo ? "text-red-300" : "text-slate-500 italic"}`}>
            {grupoSanguineo ? `🩸 ${grupoSanguineo}` : "No registrado"}
          </p>
        )}
      </div>

      {/* 2. Alergias Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-5 space-y-4">
        <AllergyListEditor
          allergies={alergias}
          onAdd={(newAllergy) => {
            const updated = [...alergias, newAllergy]
            saveMedicalUpdate({ alergias: updated })
          }}
          onDelete={(index) => {
            const updated = alergias.filter((_, i) => i !== index)
            saveMedicalUpdate({ alergias: updated })
          }}
        />
      </div>

      {/* 3. Vacunas Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Syringe className="w-4 h-4 text-emerald-400" />
            Registro de Vacunas
          </h2>
          {!showVaccineForm && (
            <button
              onClick={() => setShowVaccineForm(true)}
              className="text-xs text-blue-400 hover:underline"
            >
              + Registrar vacuna
            </button>
          )}
        </div>

        {vacunas.length === 0 && !showVaccineForm && (
          <p className="text-xs text-slate-500">No hay vacunas registradas.</p>
        )}

        <div className="space-y-2">
          {vacunas.map((v) => (
            <div key={v.id} className="flex items-start justify-between gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">{v.vacuna}</p>
                  {v.dosis && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">
                      {v.dosis}
                    </span>
                  )}
                  {v.proximaDosis && (
                    <span className="rounded bg-amber-950/40 px-1.5 py-0.5 text-xs text-amber-300">
                      Próx: {v.proximaDosis}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aplicación: {v.fechaAplicacion} {v.lote && `· Lote: ${v.lote}`} {v.aplicadoPor && `· por: ${v.aplicadoPor}`}
                </p>
                {v.notas && <p className="text-xs text-slate-500 mt-0.5">{v.notas}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteVaccine(v.id)}
                className="text-slate-500 hover:text-red-400 transition-colors"
                title="Eliminar"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {showVaccineForm && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-slate-400">Vacuna</Label>
                <select
                  value={vaccineInput.vacuna}
                  onChange={(e) => setVaccineInput(v => ({ ...v, vacuna: e.target.value }))}
                  className="w-full rounded-md border border-slate-700 bg-slate-850 px-2 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="">— Seleccionar —</option>
                  {VACUNAS_VE.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                {vaccineInput.vacuna === "Otra" && (
                  <Input
                    className="mt-1.5 bg-slate-850 border-slate-705 text-white text-sm h-8"
                    placeholder="Nombre de la vacuna"
                    value={vaccineInput.otraVacuna}
                    onChange={(e) => setVaccineInput(v => ({ ...v, otraVacuna: e.target.value }))}
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Fecha de aplicación</Label>
                <Input
                  type="date"
                  value={vaccineInput.fechaAplicacion}
                  onChange={(e) => setVaccineInput(v => ({ ...v, fechaAplicacion: e.target.value }))}
                  className="bg-slate-850 border-slate-705 text-white text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Dosis (ej: 1ª, 2ª, Refuerzo)</Label>
                <Input
                  value={vaccineInput.dosis}
                  onChange={(e) => setVaccineInput(v => ({ ...v, dosis: e.target.value }))}
                  placeholder="Ej: 1ª dosis"
                  className="bg-slate-850 border-slate-705 text-white text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Lote (opcional)</Label>
                <Input
                  value={vaccineInput.lote}
                  onChange={(e) => setVaccineInput(v => ({ ...v, lote: e.target.value }))}
                  placeholder="Ej: AX4B"
                  className="bg-slate-850 border-slate-705 text-white text-sm h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Próxima dosis (opcional)</Label>
                <Input
                  type="date"
                  value={vaccineInput.proximaDosis}
                  onChange={(e) => setVaccineInput(v => ({ ...v, proximaDosis: e.target.value }))}
                  className="bg-slate-850 border-slate-705 text-white text-sm h-8"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-slate-400">Aplicado por (opcional)</Label>
                <Input
                  value={vaccineInput.aplicadoPor}
                  onChange={(e) => setVaccineInput(v => ({ ...v, aplicadoPor: e.target.value }))}
                  placeholder="Ej: Clínica o profesional"
                  className="bg-slate-850 border-slate-705 text-white text-sm h-8"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-slate-400">Notas (opcional)</Label>
                <Input
                  value={vaccineInput.notas}
                  onChange={(e) => setVaccineInput(v => ({ ...v, notas: e.target.value }))}
                  placeholder="Observaciones..."
                  className="bg-slate-850 border-slate-705 text-white text-sm h-8"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleAddVaccine}
                disabled={!(vaccineInput.vacuna === "Otra" ? vaccineInput.otraVacuna : vaccineInput.vacuna).trim() || !vaccineInput.fechaAplicacion}
                className="bg-emerald-700 hover:bg-emerald-600"
              >
                Guardar vacuna
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowVaccineForm(false)}
                className="text-slate-400"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Seguro Médico Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Shield className="w-4 h-4 text-blue-400" />
            Seguro Médico (HMO)
          </h2>
          {!showInsuranceForm && (
            <button
              onClick={() => setShowInsuranceForm(true)}
              className="text-xs text-blue-400 hover:underline"
            >
              + Agregar
            </button>
          )}
        </div>

        {seguros.length === 0 && !showInsuranceForm && (
          <p className="text-xs text-slate-500">Sin seguros registrados.</p>
        )}

        <ul className="space-y-2">
          {seguros.map((ins) => (
            <li
              key={ins.id}
              className={`rounded-md border px-3 py-2.5 text-xs ${
                ins.activa ? "border-blue-900 bg-blue-950/20" : "border-slate-800 bg-slate-900/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-200 text-sm">{ins.provider}</p>
                  <p className="text-slate-400 mt-0.5">
                    Póliza: {ins.numeroPoliza} {ins.titular && `· Titular: ${ins.titular}`}
                  </p>
                  <p className="text-slate-400">
                    Cobertura: {ins.coberturaPct}% {ins.fechaVigencia && `· Vigencia hasta: ${ins.fechaVigencia}`}
                  </p>
                  {ins.notas && <p className="mt-1 text-slate-500">{ins.notas}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleInsurance(ins.id)}
                    title={ins.activa ? "Desactivar" : "Activar"}
                    className="rounded p-1.5 text-slate-400 hover:text-white hover:bg-slate-850"
                  >
                    {ins.activa ? <Check className="h-3.5 w-3.5 text-green-400" /> : <X className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteInsurance(ins.id)}
                    className="rounded p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-850"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {showInsuranceForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAddInsurance()
            }}
            className="space-y-2 rounded-md border border-slate-850 bg-slate-950/40 p-4 text-xs space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-slate-400">Aseguradora / Compañía *</Label>
                <Input
                  required
                  value={insuranceInput.provider}
                  onChange={(e) => setInsuranceInput(i => ({ ...i, provider: e.target.value }))}
                  placeholder="Ej: Seguros Caracas, Mercantil"
                  className="bg-slate-850 border-slate-705 text-white h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">N° Póliza *</Label>
                <Input
                  required
                  value={insuranceInput.numeroPoliza}
                  onChange={(e) => setInsuranceInput(i => ({ ...i, numeroPoliza: e.target.value }))}
                  placeholder="Ej: POL-82910"
                  className="bg-slate-850 border-slate-705 text-white h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Cobertura %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={insuranceInput.coberturaPct}
                  onChange={(e) => setInsuranceInput(i => ({ ...i, coberturaPct: Number(e.target.value) }))}
                  className="bg-slate-850 border-slate-705 text-white h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Titular</Label>
                <Input
                  value={insuranceInput.titular}
                  onChange={(e) => setInsuranceInput(i => ({ ...i, titular: e.target.value }))}
                  placeholder="Ej: Nombre completo"
                  className="bg-slate-850 border-slate-705 text-white h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Vigencia hasta</Label>
                <Input
                  type="date"
                  value={insuranceInput.fechaVigencia}
                  onChange={(e) => setInsuranceInput(i => ({ ...i, fechaVigencia: e.target.value }))}
                  className="bg-slate-850 border-slate-705 text-white h-9"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-slate-400">Notas</Label>
                <Input
                  value={insuranceInput.notas}
                  onChange={(e) => setInsuranceInput(i => ({ ...i, notas: e.target.value }))}
                  placeholder="Notas adicionales..."
                  className="bg-slate-850 border-slate-705 text-white h-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                Guardar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowInsuranceForm(false)} className="text-slate-400">
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* 5. Antecedentes Médicos Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <ClipboardList className="w-4 h-4 text-purple-400" />
            Antecedentes Médicos
          </h2>
          {!showAntecedentesForm && (
            <button
              onClick={() => setShowAntecedentesForm(true)}
              className="text-xs text-blue-400 hover:underline"
            >
              Editar
            </button>
          )}
        </div>

        {showAntecedentesForm ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Personales</p>
                <CheckRow label="Hipertensión" checked={antecedentes.personal?.hipertension} onChange={(v) => setPersonal("hipertension", v)} />
                <CheckRow label="Diabetes" checked={antecedentes.personal?.diabetes} onChange={(v) => setPersonal("diabetes", v)} />
                <CheckRow label="Cardiopatía" checked={antecedentes.personal?.cardiopatia} onChange={(v) => setPersonal("cardiopatia", v)} />
                <CheckRow label="Asma" checked={antecedentes.personal?.asma} onChange={(v) => setPersonal("asma", v)} />
                <CheckRow label="Epilepsia" checked={antecedentes.personal?.epilepsia} onChange={(v) => setPersonal("epilepsia", v)} />
                <CheckRow label="Cáncer" checked={antecedentes.personal?.cancer} onChange={(v) => setPersonal("cancer", v)} />
                <Input
                  placeholder="Otros..."
                  value={antecedentes.personal?.otros ?? ""}
                  onChange={(e) => setPersonal("otros", e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 text-white mt-1 h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Familiares</p>
                <CheckRow label="Hipertensión" checked={antecedentes.familiares?.hipertension} onChange={(v) => setFamiliares("hipertension", v)} />
                <CheckRow label="Diabetes" checked={antecedentes.familiares?.diabetes} onChange={(v) => setFamiliares("diabetes", v)} />
                <CheckRow label="Cardiopatía" checked={antecedentes.familiares?.cardiopatia} onChange={(v) => setFamiliares("cardiopatia", v)} />
                <Input
                  placeholder="Otros..."
                  value={antecedentes.familiares?.otros ?? ""}
                  onChange={(e) => setFamiliares("otros", e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 text-white mt-1 h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hábitos</p>
                <CheckRow label="Fumador" checked={antecedentes.habitos?.fumador} onChange={(v) => setHabitos("fumador", v)} />
                <CheckRow label="Alcohol" checked={antecedentes.habitos?.alcohol} onChange={(v) => setHabitos("alcohol", v)} />
                <CheckRow label="Sustancias" checked={antecedentes.habitos?.drogas} onChange={(v) => setHabitos("drogas", v)} />
                <Input
                  placeholder="Otros..."
                  value={antecedentes.habitos?.otros ?? ""}
                  onChange={(e) => setHabitos("otros", e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 text-white mt-1 h-8 text-xs"
                />

                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-3">Quirúrgicos</p>
                <textarea
                  rows={2}
                  placeholder="Cirugías previas..."
                  value={antecedentes.quirurgicos ?? ""}
                  onChange={(e) => setAntecedentes(d => ({ ...d, quirurgicos: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white resize-none focus:outline-none"
                />

                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gineco-obstétricos</p>
                <textarea
                  rows={2}
                  placeholder="Embarazos, partos, abortos..."
                  value={antecedentes.ginecologicos ?? ""}
                  onChange={(e) => setAntecedentes(d => ({ ...d, ginecologicos: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white resize-none focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <Button
                size="sm"
                onClick={() => {
                  saveMedicalUpdate({ antecedentes })
                  setShowAntecedentesForm(false)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Guardar antecedentes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAntecedentesForm(false)}
                className="text-slate-400"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-950/30 p-3 rounded-lg border border-slate-800">
            <div className="space-y-1">
              <p className="font-semibold text-slate-400">Personales:</p>
              <p className="text-slate-200">
                {[
                  antecedentes.personal?.hipertension && "Hipertensión",
                  antecedentes.personal?.diabetes && "Diabetes",
                  antecedentes.personal?.cardiopatia && "Cardiopatía",
                  antecedentes.personal?.asma && "Asma",
                  antecedentes.personal?.epilepsia && "Epilepsia",
                  antecedentes.personal?.cancer && "Cáncer",
                  antecedentes.personal?.otros,
                ].filter(Boolean).join(", ") || "Ninguno"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-400">Familiares:</p>
              <p className="text-slate-200">
                {[
                  antecedentes.familiares?.hipertension && "Hipertensión",
                  antecedentes.familiares?.diabetes && "Diabetes",
                  antecedentes.familiares?.cardiopatia && "Cardiopatía",
                  antecedentes.familiares?.otros,
                ].filter(Boolean).join(", ") || "Ninguno"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-400">Hábitos / Quirúrgicos:</p>
              <p className="text-slate-200">
                {[
                  antecedentes.habitos?.fumador && "Fumador",
                  antecedentes.habitos?.alcohol && "Alcohol",
                  antecedentes.habitos?.drogas && "Sustancias",
                  antecedentes.habitos?.otros,
                ].filter(Boolean).join(", ") || "Ninguno"}
              </p>
              {antecedentes.quirurgicos && (
                <p className="text-slate-400 mt-1">
                  <span className="font-semibold">Quirúrgicos:</span> {antecedentes.quirurgicos}
                </p>
              )}
              {antecedentes.ginecologicos && (
                <p className="text-slate-400 mt-0.5">
                  <span className="font-semibold">Gineco-Obstétricos:</span> {antecedentes.ginecologicos}
                </p>
              )}
            </div>
          </div>
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

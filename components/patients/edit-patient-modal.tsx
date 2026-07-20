"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trpc } from "@/lib/trpc-client"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { CountryCodeSelect } from "@/components/ui/country-code-select"
import type { SexoType, IdentificationType, ParentRelationship } from "@prisma/client"

interface EditPatientModalProps {
  patientId: string
  initialData: {
    nombre: string
    apellido: string
    fechaNacimiento: Date
    sexo: SexoType
    tipoIdentificacion?: IdentificationType | null
    numeroIdentificacion?: string | null
    sinCedula: boolean
    telefono?: string | null
    codigoPais?: string | null
    email?: string | null
    direccion?: string | null
    repCedula?: string | null
    repNombreCompleto?: string | null
    repParentesco?: ParentRelationship | null
    repTelefono?: string | null
  }
}

export function EditPatientModal({ patientId, initialData }: EditPatientModalProps) {
  const [open, setOpen] = useState(false)
  const [sinCedula, setSinCedula] = useState(initialData.sinCedula)
  const [tipoId, setTipoId] = useState<IdentificationType>(initialData.tipoIdentificacion || "CEDULA_V")
  const [numeroId, setNumeroId] = useState(initialData.numeroIdentificacion || "")
  const [nombre, setNombre] = useState(initialData.nombre)
  const [apellido, setApellido] = useState(initialData.apellido)
  const [fechaNacimiento, setFechaNacimiento] = useState(
    initialData.fechaNacimiento ? new Date(initialData.fechaNacimiento).toISOString().split("T")[0] : ""
  )
  const [sexo, setSexo] = useState<SexoType>(initialData.sexo)
  
  const [telefono, setTelefono] = useState(initialData.telefono || "")
  const [codigoPais, setCodigoPais] = useState(initialData.codigoPais || "+58")
  const [email, setEmail] = useState(initialData.email || "")
  const [direccion, setDireccion] = useState(initialData.direccion || "")

  const [repCedula, setRepCedula] = useState(initialData.repCedula || "")
  const [repNombre, setRepNombre] = useState(initialData.repNombreCompleto || "")
  const [repParentesco, setRepParentesco] = useState<ParentRelationship>(initialData.repParentesco || "MADRE")
  const [repTelefono, setRepTelefono] = useState(initialData.repTelefono || "")

  const router = useRouter()
  const utils = trpc.useUtils()
  
  const updatePatient = trpc.patient.update.useMutation({
    onSuccess: () => {
      toast.success("Paciente actualizado correctamente")
      setOpen(false)
      utils.patient.getRegistration.invalidate()
      router.refresh()
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    updatePatient.mutate({
      patientId,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      fechaNacimiento,
      sexo,
      tipoIdentificacion: sinCedula ? undefined : tipoId,
      numeroIdentificacion: sinCedula ? undefined : numeroId.trim(),
      sinCedula,
      telefono: telefono.trim(),
      codigoPais: codigoPais,
      email: email.trim(),
      direccion: direccion.trim(),
      representante: sinCedula
        ? {
            cedulaRepresentante: repCedula.trim(),
            nombreCompleto: repNombre.trim(),
            parentesco: repParentesco,
            telefono: repTelefono.trim() || undefined,
          }
        : undefined,
    })
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setOpen(true)}
        className="h-8 gap-2 bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar paciente
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-slate-950 w-full max-w-2xl rounded-lg shadow-xl border border-slate-800 text-white my-8">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">Editar datos del paciente</h2>
              <p className="text-sm text-slate-400 mb-6">
                Modifica los datos personales o de contacto del paciente. Modificar la cédula requiere cuidado.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Identificación */}
                <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="sinCedulaEdit"
                      checked={sinCedula}
                      onChange={(e) => setSinCedula(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700"
                    />
                    <Label htmlFor="sinCedulaEdit" className="text-slate-300 cursor-pointer">
                      Sin cédula (menor de edad)
                    </Label>
                  </div>

                  {!sinCedula && (
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={tipoId}
                        onChange={(e) => setTipoId(e.target.value as IdentificationType)}
                        className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm w-36 shrink-0"
                      >
                        <option value="CEDULA_V">V-</option>
                        <option value="CEDULA_E">E-</option>
                        <option value="PASAPORTE">Pasaporte</option>
                      </select>
                      <Input
                        placeholder="12345678"
                        value={numeroId}
                        onChange={(e) => setNumeroId(e.target.value)}
                        required={!sinCedula}
                        className="bg-slate-800 border-slate-700 text-white flex-1 min-w-0"
                      />
                    </div>
                  )}
                </div>

                {/* Datos personales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nombre</Label>
                    <Input value={nombre} onChange={e => setNombre(e.target.value)} required className="bg-slate-900 border-slate-800 text-white w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Apellido</Label>
                    <Input value={apellido} onChange={e => setApellido(e.target.value)} required className="bg-slate-900 border-slate-800 text-white w-full" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Fecha de Nacimiento</Label>
                    <Input
                      type="date"
                      value={fechaNacimiento}
                      onChange={e => setFechaNacimiento(e.target.value)}
                      required
                      className="bg-slate-900 border-slate-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Sexo</Label>
                    <select
                      value={sexo}
                      onChange={e => setSexo(e.target.value as SexoType)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-md px-3 py-2 text-sm h-10"
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMENINO">Femenino</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Contacto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Teléfono</Label>
                    <div className="flex gap-2">
                      <CountryCodeSelect value={codigoPais} onChange={setCodigoPais} />
                      <Input value={telefono} onChange={e => setTelefono(e.target.value)} className="bg-slate-900 border-slate-800 text-white w-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-slate-900 border-slate-800 text-white w-full" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Dirección</Label>
                  <Input value={direccion} onChange={e => setDireccion(e.target.value)} className="bg-slate-900 border-slate-800 text-white w-full" />
                </div>

                {/* Representante — solo si sin cédula */}
                {sinCedula && (
                  <div className="border border-slate-700 rounded-lg p-4 space-y-4 bg-slate-900/30">
                    <p className="text-slate-300 text-sm font-medium">Datos del Representante</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs">Cédula</Label>
                        <Input
                          placeholder="V-12345678"
                          value={repCedula}
                          onChange={e => setRepCedula(e.target.value)}
                          required={sinCedula}
                          className="bg-slate-900 border-slate-800 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs">Nombre Completo</Label>
                        <Input
                          placeholder="Nombre del representante"
                          value={repNombre}
                          onChange={e => setRepNombre(e.target.value)}
                          required={sinCedula}
                          className="bg-slate-900 border-slate-800 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs">Parentesco</Label>
                        <select
                          value={repParentesco}
                          onChange={e => setRepParentesco(e.target.value as ParentRelationship)}
                          required={sinCedula}
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-md px-3 py-2 text-sm h-10"
                        >
                          <option value="MADRE">Madre</option>
                          <option value="PADRE">Padre</option>
                          <option value="TUTOR_LEGAL">Tutor Legal</option>
                          <option value="OTRO">Otro</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs">Teléfono</Label>
                        <Input
                          placeholder="Teléfono"
                          value={repTelefono}
                          onChange={e => setRepTelefono(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setOpen(false)}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                    disabled={updatePatient.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={updatePatient.isPending}
                  >
                    {updatePatient.isPending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

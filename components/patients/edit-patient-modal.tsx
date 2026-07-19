"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
// Removed dialog imports
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trpc } from "@/lib/trpc-client"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { CountryCodeSelect } from "@/components/ui/country-code-select"

interface EditPatientModalProps {
  patientId: string
  initialData: {
    telefono?: string | null
    codigoPais?: string | null
    email?: string | null
    direccion?: string | null
  }
}

export function EditPatientModal({ patientId, initialData }: EditPatientModalProps) {
  const [open, setOpen] = useState(false)
  const [telefono, setTelefono] = useState(initialData.telefono || "")
  const [codigoPais, setCodigoPais] = useState(initialData.codigoPais || "+58")
  const [email, setEmail] = useState(initialData.email || "")
  const [direccion, setDireccion] = useState(initialData.direccion || "")
  
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
      telefono: telefono.trim(),
      codigoPais: codigoPais,
      email: email.trim(),
      direccion: direccion.trim(),
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-950 w-full max-w-md rounded-lg shadow-xl border border-slate-800 overflow-hidden text-white">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">Editar datos del paciente</h2>
              <p className="text-sm text-slate-400 mb-4">
                Actualiza la información de contacto o dirección del paciente.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-slate-300">Teléfono</Label>
                  <div className="flex gap-2">
                    <CountryCodeSelect value={codigoPais} onChange={setCodigoPais} />
                    <Input
                      id="telefono"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="bg-slate-900 border-slate-800 flex-1"
                      placeholder="412 1234567"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900 border-slate-800"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion" className="text-slate-300">Dirección</Label>
                  <Input
                    id="direccion"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="bg-slate-900 border-slate-800"
                    placeholder="Ej. Calle 1, Edificio X"
                  />
                </div>
                
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

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
// removed dialog imports
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trpc } from "@/lib/trpc-client"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface DeletePatientModalProps {
  patientId: string
  patientName: string
}

export function DeletePatientModal({ patientId, patientName }: DeletePatientModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  
  const router = useRouter()
  
  const deletePatient = trpc.patient.delete.useMutation({
    onSuccess: () => {
      toast.success("Paciente eliminado correctamente")
      setOpen(false)
      // Redirect to patient list after deletion
      router.push("/doctor/patients")
      router.refresh()
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmText.trim().toLowerCase() !== "eliminar") {
      toast.error("Debe escribir 'eliminar' para confirmar")
      return
    }
    deletePatient.mutate({ patientId })
  }

  const handleOpen = () => {
    setConfirmText("")
    setOpen(true)
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleOpen}
        className="h-8 gap-2 bg-red-950/20 border-red-900/50 text-red-400 hover:text-red-300 hover:bg-red-900/40"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Eliminar
      </Button>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-950 w-full max-w-md rounded-lg shadow-xl border border-red-900/50 overflow-hidden text-white">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2 text-red-400">Eliminar Paciente</h2>
              <p className="text-sm text-slate-400 mb-4">
                ¿Está seguro de que desea eliminar al paciente <strong className="text-white">{patientName}</strong>? 
                Esta acción no se puede deshacer y eliminará también todas sus consultas e historial clínico de su consultorio.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmText" className="text-slate-300">
                    Escriba <span className="font-bold text-red-400">eliminar</span> para confirmar:
                  </Label>
                  <Input
                    id="confirmText"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="bg-slate-900 border-slate-800"
                    placeholder="eliminar"
                    autoComplete="off"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setOpen(false)}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                    disabled={deletePatient.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={confirmText.trim().toLowerCase() !== "eliminar" || deletePatient.isPending}
                  >
                    {deletePatient.isPending ? "Eliminando..." : "Eliminar paciente"}
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

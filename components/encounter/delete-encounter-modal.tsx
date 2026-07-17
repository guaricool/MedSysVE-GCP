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

interface DeleteEncounterModalProps {
  encounterId: string
  patientRegId: string
}

export function DeleteEncounterModal({ encounterId, patientRegId }: DeleteEncounterModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  
  const router = useRouter()
  
  const deleteEncounter = trpc.encounter.delete.useMutation({
    onSuccess: () => {
      toast.success("Consulta eliminada correctamente")
      setOpen(false)
      // Redirect to patient history page
      router.push(`/doctor/patients/${patientRegId}`)
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
    deleteEncounter.mutate({ id: encounterId })
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
        Eliminar consulta
      </Button>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-950 w-full max-w-md rounded-lg shadow-xl border border-red-900/50 overflow-hidden text-white">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2 text-red-400">Eliminar Consulta</h2>
              <p className="text-sm text-slate-400 mb-4">
                ¿Está seguro de que desea eliminar esta consulta? 
                Esta acción no se puede deshacer. Se eliminarán permanentemente todos los datos registrados en esta consulta.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmTextEncounter" className="text-slate-300">
                    Escriba <span className="font-bold text-red-400">eliminar</span> para confirmar:
                  </Label>
                  <Input
                    id="confirmTextEncounter"
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
                    disabled={deleteEncounter.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={confirmText.trim().toLowerCase() !== "eliminar" || deleteEncounter.isPending}
                  >
                    {deleteEncounter.isPending ? "Eliminando..." : "Eliminar consulta"}
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

"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FilePen } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  patientRegId: string
}

export function AddendumForm({ encounterId, patientRegId }: Props) {
  const router = useRouter()
  const [texto, setTexto] = useState("")

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return texto.trim() !== ""
  }, [texto])

  useEffect(() => {
    setDirty("addendum", isDirty)
  }, [isDirty, setDirty])

  const addendum = trpc.encounter.addAddendum.useMutation({
    onSuccess: () => {
      setTexto("")
      router.refresh()
    },
  })

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        La consulta está firmada. Puede agregar una adenda con correcciones o información adicional.
      </p>

      <Textarea
        rows={5}
        placeholder="Texto de la adenda (correcciones o información adicional)..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />

      <Button
        disabled={!texto.trim() || addendum.isPending}
        onClick={() =>
          addendum.mutate({
            encounterId,
            patientRegistrationId: patientRegId,
            texto,
          })
        }
        variant="outline"
        className="border-slate-700 text-slate-300 hover:bg-slate-800"
      >
        <FilePen size={14} className="mr-2" />
        {addendum.isPending ? "Guardando..." : "Agregar Adenda"}
      </Button>

      {addendum.isSuccess && (
        <p className="text-sm text-green-400">Adenda registrada y consulta marcada como AMENDED.</p>
      )}
    </div>
  )
}

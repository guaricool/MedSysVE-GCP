"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Trash2 } from "lucide-react"

interface Props {
  encounterId: string
  disabled?: boolean
  onApplyTemplate?: (template: any) => void
}

export function TemplateSelector({ encounterId, disabled, onApplyTemplate }: Props) {
  const [open, setOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [applied, setApplied] = useState(false)
  const router = useRouter()
  const utils = trpc.useUtils()

  const { data: rawEnc } = trpc.encounter.get.useQuery({ id: encounterId })
  const enc = rawEnc as any

  const { data: doctor } = (trpc.doctor.myProfile.useQuery as any)()
  const especialidad = doctor?.especialidadPrincipal

  const { data: rawTemplates = [] } = (trpc.template as any).list.useQuery(
    especialidad ? { especialidad } : undefined
  )
  const templates = rawTemplates as any[]

  const applyTmpl = (trpc.encounter as any).update.useMutation({
    onSuccess: (_: any, variables: any) => {
      utils.encounter.get.invalidate({ id: encounterId })
      setOpen(false)
      setApplied(true)
      router.refresh()
      if (onApplyTemplate) {
        onApplyTemplate(variables)
      }
    },
  })

  const saveTmpl = (trpc.template as any).save.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate()
      setSaveOpen(false)
      setNombre("")
      setDescripcion("")
    },
  })

  const delTmpl = (trpc.template as any).delete.useMutation({
    onSuccess: () => utils.template.list.invalidate(),
  })

  if (disabled) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen((o) => !o)}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <BookOpen size={13} className="mr-1.5" />
          Plantillas
          <span className="ml-1 text-xs text-slate-500">{templates.length > 0 ? `(${templates.length})` : ""}</span>
        </Button>
        {applied && (
          <span className="text-xs text-emerald-400">Plantilla aplicada — recarga visible en los campos.</span>
        )}
      </div>

      {open && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-3">
          {templates.length === 0 ? (
            <p className="text-sm text-slate-500">No hay plantillas guardadas.</p>
          ) : (
            <ul className="space-y-2">
              {templates.map((t: any) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded border border-slate-800 bg-slate-800/50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{t.nombre}</p>
                    {t.descripcion && <p className="text-xs text-slate-500">{t.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        applyTmpl.mutate({
                          id: encounterId,
                          motivo: t.motivo || undefined,
                          historiaClinica: t.historiaClinica || undefined,
                          plan: t.plan || undefined,
                          examenFisico: t.examenFisico || undefined,
                          datosEspecialidad: t.datosEspecialidad || undefined,
                        })
                      }
                      disabled={applyTmpl.isPending}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Aplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => delTmpl.mutate({ id: t.id })}
                      className="text-slate-600 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setSaveOpen((s) => !s)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              {saveOpen ? "▲ Cancelar" : "▼ Guardar consulta actual como plantilla"}
            </button>
            {saveOpen && (
              <div className="mt-2 space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Nombre de la plantilla *</Label>
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: HTA seguimiento"
                    className="bg-slate-800 border-slate-700 text-white h-8 text-sm"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Descripción (opcional)</Label>
                  <Input
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Breve descripción"
                    className="bg-slate-800 border-slate-700 text-white h-8 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  disabled={!nombre || saveTmpl.isPending}
                  onClick={() =>
                    saveTmpl.mutate({
                      nombre,
                      descripcion: descripcion || undefined,
                      motivo: enc?.motivo,
                      historiaClinica: enc?.historiaClinica,
                      plan: enc?.plan,
                      examenFisico: enc?.examenFisico || undefined,
                      datosEspecialidad: enc?.datosEspecialidad || undefined,
                      especialidad: especialidad || undefined,
                    })
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saveTmpl.isPending ? "Guardando..." : "Guardar plantilla"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

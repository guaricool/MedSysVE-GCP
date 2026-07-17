"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Plus, Pencil, Check, X, FileCheck } from "lucide-react"

interface Template {
  id: string
  titulo: string
  contenido: string
  activo: boolean
}

const DEFAULT_TEMPLATES = [
  {
    titulo: "Consentimiento General de Atención Médica",
    contenido: `Yo, el/la paciente (o representante legal), autorizo al médico tratante y a su equipo a realizar los procedimientos diagnósticos y terapéuticos necesarios para mi atención médica. Entiendo que se me ha explicado mi condición de salud y el plan de tratamiento propuesto, incluyendo sus riesgos y beneficios. Doy mi consentimiento libre y voluntario para recibir atención médica.`,
  },
  {
    titulo: "Consentimiento para Procedimientos Invasivos",
    contenido: `Autorizo al médico a realizar el procedimiento indicado, habiendo sido informado/a sobre: (1) La naturaleza del procedimiento, (2) los riesgos y complicaciones posibles, (3) las alternativas disponibles, y (4) las consecuencias de no realizarlo. Confirmo que mis preguntas han sido respondidas satisfactoriamente.`,
  },
  {
    titulo: "Consentimiento para Telemedicina / Videoconsulta",
    contenido: `Acepto participar en una consulta médica a través de medios electrónicos (videollamada). Entiendo que: (1) La información transmitida es confidencial, (2) pueden existir limitaciones técnicas que afecten la calidad de la consulta, (3) el médico puede referirme a una consulta presencial si es necesario, y (4) la telemedicina no reemplaza la atención de emergencia.`,
  },
  {
    titulo: "Consentimiento para Fotografías con Fines Médicos",
    contenido: `Autorizo la toma y almacenamiento de fotografías o imágenes con fines exclusivamente médicos y de documentación clínica. Entiendo que estas imágenes son parte de mi expediente médico y están protegidas por la confidencialidad médica.`,
  },
]

export function ConsentTemplatesClient() {
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ titulo?: string; contenido?: string }>({})
  const [titulo, setTitulo] = useState("")
  const [contenido, setContenido] = useState("")
  const utils = trpc.useUtils()

  const { data: templates = [], isLoading } = (trpc.consent as any).listTemplates.useQuery()

  const createMutation = (trpc.consent as any).createTemplate.useMutation({
    onSuccess: () => {
      utils.invalidate()
      setShowCreate(false)
      setTitulo("")
      setContenido("")
    },
    onError: (e: any) => alert(e.message),
  })

  const updateMutation = (trpc.consent as any).updateTemplate.useMutation({
    onSuccess: () => {
      utils.invalidate()
      setEditId(null)
    },
    onError: (e: any) => alert(e.message),
  })

  function seedDefault(tpl: { titulo: string; contenido: string }) {
    setTitulo(tpl.titulo)
    setContenido(tpl.contenido)
    setShowCreate(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowCreate((v) => !v); setTitulo(""); setContenido("") }}
          className="flex items-center gap-1.5 rounded bg-purple-700 px-3 py-1.5 text-sm text-white hover:bg-purple-600"
        >
          <Plus className="h-4 w-4" />
          Nueva plantilla
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 space-y-3 text-sm">
          <h2 className="font-semibold text-white">Nueva plantilla de consentimiento</h2>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-slate-400">Título *</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white text-sm"
                placeholder="Ej: Consentimiento para cirugía menor"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Contenido del consentimiento *</label>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                rows={6}
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white text-sm resize-y"
                placeholder="Texto completo del consentimiento informado..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate({ titulo, contenido })}
              disabled={!titulo.trim() || !contenido.trim() || createMutation.isPending}
              className="rounded bg-purple-700 px-4 py-1.5 text-sm text-white hover:bg-purple-600 disabled:opacity-50"
            >
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={() => setShowCreate(false)} className="text-sm text-slate-400 hover:text-white">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!isLoading && templates.length === 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="h-5 w-5 text-slate-600" />
            <p className="text-sm text-slate-400">No hay plantillas. Usa una de estas plantillas predefinidas:</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {DEFAULT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.titulo}
                onClick={() => seedDefault(tpl)}
                className="text-left rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:border-purple-700 hover:text-white transition-colors"
              >
                {tpl.titulo}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(templates as Template[]).map((tpl) => {
          const isEditing = editId === tpl.id
          return (
            <div
              key={tpl.id}
              className={`rounded-lg border p-4 text-sm ${
                tpl.activo ? "border-slate-700 bg-slate-900" : "border-slate-800 bg-slate-900 opacity-50"
              }`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={editData.titulo ?? tpl.titulo}
                    onChange={(e) => setEditData((d) => ({ ...d, titulo: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white font-medium"
                  />
                  <textarea
                    value={editData.contenido ?? tpl.contenido}
                    onChange={(e) => setEditData((d) => ({ ...d, contenido: e.target.value }))}
                    rows={5}
                    className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-300 text-xs resize-y"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMutation.mutate({ id: tpl.id, ...editData })}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1 rounded bg-purple-700 px-3 py-1 text-xs text-white hover:bg-purple-600 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Guardar
                    </button>
                    <button onClick={() => setEditId(null)} className="text-xs text-slate-400 hover:text-white">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white">
                      {tpl.titulo}
                      {!tpl.activo && <span className="ml-2 text-xs text-slate-500">Inactiva</span>}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditId(tpl.id); setEditData({ titulo: tpl.titulo, contenido: tpl.contenido }) }}
                        className="rounded p-1.5 text-slate-500 hover:text-white hover:bg-slate-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => updateMutation.mutate({ id: tpl.id, activo: !tpl.activo })}
                        title={tpl.activo ? "Desactivar" : "Activar"}
                        className="rounded p-1.5 text-slate-500 hover:text-white hover:bg-slate-800"
                      >
                        {tpl.activo ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 text-green-400" />}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">{tpl.contenido}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

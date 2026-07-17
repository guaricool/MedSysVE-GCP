"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { useRouter } from "next/navigation"
import { Plus, Trash2, FileText, FlaskConical, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Tipo = "RECETA" | "LABORATORIO" | "IMAGEN"

interface RecetaItem {
  medicamento: string
  dosis: string
  frecuencia: string
  duracion: string
  notas?: string
}

interface LabItem {
  estudio: string
  notas?: string
}

interface ImagenItem {
  tipoImagen: string
  region: string
  notas?: string
}

export function ExpressOrderForm() {
  const router = useRouter()
  const [tipo, setTipo] = useState<Tipo>("RECETA")
  const [pacienteNombre, setPacienteNombre] = useState("")
  const [pacienteApellido, setPacienteApellido] = useState("")
  const [pacienteCedula, setPacienteCedula] = useState("")
  const [pacienteEdad, setPacienteEdad] = useState<number | "">("")
  const [pacienteSexo, setPacienteSexo] = useState("")
  const [diagnosticos, setDiagnosticos] = useState("")
  const [indicaciones, setIndicaciones] = useState("")

  const [recetaItems, setRecetaItems] = useState<RecetaItem[]>([
    { medicamento: "", dosis: "", frecuencia: "", duracion: "", notas: "" },
  ])
  const [labItems, setLabItems] = useState<LabItem[]>([{ estudio: "", notas: "" }])
  const [imagItems, setImagItems] = useState<ImagenItem[]>([{ tipoImagen: "", region: "", notas: "" }])

  type ExpressInput = { tipo: "RECETA" | "LABORATORIO" | "IMAGEN"; pacienteNombre: string; pacienteApellido: string; pacienteCedula?: string; pacienteEdad: number; pacienteSexo?: string; items: unknown[]; diagnosticos?: string; indicaciones?: string }
  type ExpressMutation = { mutate: (input: ExpressInput) => void; isPending: boolean; isError: boolean; error: unknown }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const create = (trpc.expressOrder.create as any).useMutation({
    onSuccess: (data: { id: string }) => {
      window.open(`/api/pdf/express/${data.id}`, "_blank")
      router.push("/doctor/express")
    },
  }) as ExpressMutation

  function buildItems() {
    if (tipo === "RECETA") return recetaItems.filter((i) => i.medicamento.trim())
    if (tipo === "LABORATORIO") return labItems.filter((i) => i.estudio.trim())
    return imagItems.filter((i) => i.tipoImagen.trim())
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pacienteNombre.trim() || !pacienteApellido.trim() || !pacienteEdad) return
    create.mutate({
      tipo,
      pacienteNombre: pacienteNombre.trim(),
      pacienteApellido: pacienteApellido.trim(),
      pacienteCedula: pacienteCedula.trim() || undefined,
      pacienteEdad: Number(pacienteEdad),
      pacienteSexo: pacienteSexo || undefined,
      items: buildItems(),
      diagnosticos: diagnosticos.trim() || undefined,
      indicaciones: indicaciones.trim() || undefined,
    })
  }

  const tipoOptions: { label: string; value: Tipo; icon: React.ReactNode }[] = [
    { label: "Receta Médica", value: "RECETA", icon: <FileText size={14} /> },
    { label: "Laboratorio", value: "LABORATORIO", icon: <FlaskConical size={14} /> },
    { label: "Imagenología", value: "IMAGEN", icon: <Scan size={14} /> },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo de Orden */}
      <div>
        <Label className="mb-2 block text-sm text-slate-300">Tipo de Documento Express</Label>
        <div className="flex gap-2">
          {tipoOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTipo(opt.value)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${
                tipo === opt.value
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-white"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Datos del Paciente */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Datos del Paciente
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block text-xs text-slate-400">Nombre *</Label>
            <Input
              value={pacienteNombre}
              onChange={(e) => setPacienteNombre(e.target.value)}
              required
              placeholder="Ej: Juan"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-slate-400">Apellido *</Label>
            <Input
              value={pacienteApellido}
              onChange={(e) => setPacienteApellido(e.target.value)}
              required
              placeholder="Ej: Pérez"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-slate-400">Cédula (Opcional)</Label>
            <Input
              value={pacienteCedula}
              onChange={(e) => setPacienteCedula(e.target.value)}
              placeholder="V-12345678"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-slate-400">Edad *</Label>
            <Input
              type="number"
              min={0}
              max={150}
              value={pacienteEdad}
              onChange={(e) => setPacienteEdad(e.target.value === "" ? "" : Number(e.target.value))}
              required
              placeholder="Ej: 35"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-slate-400">Sexo (Opcional)</Label>
            <select
              value={pacienteSexo}
              onChange={(e) => setPacienteSexo(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Sin especificar</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items según tipo */}
      {tipo === "RECETA" && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Medicamentos</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={() => setRecetaItems([...recetaItems, { medicamento: "", dosis: "", frecuencia: "", duracion: "", notas: "" }])}
            >
              <Plus size={12} className="mr-1" /> Agregar
            </Button>
          </div>
          {recetaItems.map((item, i) => (
            <div key={i} className="rounded-md border border-slate-700 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Medicamento {i + 1}</span>
                {recetaItems.length > 1 && (
                  <button
                    type="button"
                    className="text-slate-500 hover:text-red-400"
                    onClick={() => setRecetaItems(recetaItems.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Input
                    value={item.medicamento}
                    onChange={(e) => { const copy = [...recetaItems]; copy[i].medicamento = e.target.value; setRecetaItems(copy) }}
                    placeholder="Nombre del medicamento *"
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
                <Input
                  value={item.dosis}
                  onChange={(e) => { const copy = [...recetaItems]; copy[i].dosis = e.target.value; setRecetaItems(copy) }}
                  placeholder="Dosis (ej: 500mg)"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                />
                <Input
                  value={item.frecuencia}
                  onChange={(e) => { const copy = [...recetaItems]; copy[i].frecuencia = e.target.value; setRecetaItems(copy) }}
                  placeholder="Frecuencia (ej: c/8h)"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                />
                <Input
                  value={item.duracion}
                  onChange={(e) => { const copy = [...recetaItems]; copy[i].duracion = e.target.value; setRecetaItems(copy) }}
                  placeholder="Duración (ej: 7 días)"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                />
                <Input
                  value={item.notas}
                  onChange={(e) => { const copy = [...recetaItems]; copy[i].notas = e.target.value; setRecetaItems(copy) }}
                  placeholder="Notas (opcional)"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {tipo === "LABORATORIO" && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Estudios de Laboratorio</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={() => setLabItems([...labItems, { estudio: "", notas: "" }])}
            >
              <Plus size={12} className="mr-1" /> Agregar
            </Button>
          </div>
          {labItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <Input
                  value={item.estudio}
                  onChange={(e) => { const copy = [...labItems]; copy[i].estudio = e.target.value; setLabItems(copy) }}
                  placeholder={`Estudio ${i + 1} (ej: Hemograma completo)`}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                />
                <Input
                  value={item.notas}
                  onChange={(e) => { const copy = [...labItems]; copy[i].notas = e.target.value; setLabItems(copy) }}
                  placeholder="Indicación / Notas (opcional)"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                />
              </div>
              {labItems.length > 1 && (
                <button
                  type="button"
                  className="text-slate-500 hover:text-red-400 mt-2"
                  onClick={() => setLabItems(labItems.filter((_, j) => j !== i))}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tipo === "IMAGEN" && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Estudios de Imagenología</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={() => setImagItems([...imagItems, { tipoImagen: "", region: "", notas: "" }])}
            >
              <Plus size={12} className="mr-1" /> Agregar
            </Button>
          </div>
          {imagItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  value={item.tipoImagen}
                  onChange={(e) => { const copy = [...imagItems]; copy[i].tipoImagen = e.target.value; setImagItems(copy) }}
                  placeholder="Tipo (ej: Radiografía, Eco)"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                />
                <Input
                  value={item.region}
                  onChange={(e) => { const copy = [...imagItems]; copy[i].region = e.target.value; setImagItems(copy) }}
                  placeholder="Región (ej: Rodilla derecha)"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                />
                <div className="col-span-2">
                  <Input
                    value={item.notas}
                    onChange={(e) => { const copy = [...imagItems]; copy[i].notas = e.target.value; setImagItems(copy) }}
                    placeholder="Indicación / Notas (opcional)"
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
              </div>
              {imagItems.length > 1 && (
                <button
                  type="button"
                  className="text-slate-500 hover:text-red-400 mt-2"
                  onClick={() => setImagItems(imagItems.filter((_, j) => j !== i))}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Diagnóstico e Indicaciones */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1 block text-xs text-slate-400">Diagnóstico(s) (Opcional)</Label>
          <Textarea
            value={diagnosticos}
            onChange={(e) => setDiagnosticos(e.target.value)}
            rows={3}
            placeholder="Ej: Fractura de Cúbito derecho"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm resize-none"
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs text-slate-400">Indicaciones Adicionales (Opcional)</Label>
          <Textarea
            value={indicaciones}
            onChange={(e) => setIndicaciones(e.target.value)}
            rows={3}
            placeholder="Ej: Ayuno de 8 horas"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          className="text-slate-400 hover:text-white"
          onClick={() => router.push("/doctor/express")}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={create.isPending || !pacienteNombre.trim() || !pacienteApellido.trim() || !pacienteEdad}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {create.isPending ? "Generando PDF..." : "Guardar y Generar PDF"}
        </Button>
      </div>

      {create.isError && (
        <p className="text-sm text-red-400">{(create.error as any)?.message ?? "Error al crear la orden"}</p>
      )}
    </form>
  )
}

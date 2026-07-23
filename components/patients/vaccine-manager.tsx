"use client"

import { useState, useRef } from "react"
import { trpc } from "@/lib/trpc-client"
import { Plus, Trash2, FileDown, Camera, Sparkles, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

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

interface Props {
  patientRegistrationId: string
}

export function VaccineManager({ patientRegistrationId }: Props) {
  const utils = trpc.useUtils()
  const isSandbox = patientRegistrationId === "sandbox-demo-pat"
  const { data: dbVaccines, isLoading } = (trpc.vaccine as any).list.useQuery(
    { patientRegistrationId },
    { enabled: !isSandbox }
  )

  const mockVaccines = [
    { id: "v1", vacuna: "BCG", fechaAplicacion: new Date("2021-05-16"), dosis: "1ra Dosis", lote: "BCG-99", aplicadoPor: "Hospital Pediátrico", notas: "Cicatriz normal" },
    { id: "v2", vacuna: "Hepatitis B", fechaAplicacion: new Date("2021-05-16"), dosis: "1ra Dosis", lote: "HB-01", aplicadoPor: "Hospital Pediátrico" },
    { id: "v3", vacuna: "Pentavalente (DPT + HepB + Hib)", fechaAplicacion: new Date("2021-07-15"), dosis: "1ra Dosis", lote: "PENTA-44", aplicadoPor: "Clínica Demo" },
    { id: "v4", vacuna: "Polio (IPV)", fechaAplicacion: new Date("2021-07-15"), dosis: "1ra Dosis", lote: "POL-12", aplicadoPor: "Clínica Demo" },
    { id: "v5", vacuna: "Rotavirus", fechaAplicacion: new Date("2021-07-15"), dosis: "1ra Dosis", lote: "ROTA-88", aplicadoPor: "Clínica Demo" },
    { id: "v6", vacuna: "SRP (Sarampión, Rubéola, Paperas)", fechaAplicacion: new Date("2022-05-15"), dosis: "1ra Dosis", lote: "SRP-77", aplicadoPor: "Consultorio Pediátrico" },
  ]

  const vaccines = isSandbox ? mockVaccines : dbVaccines

  const [showForm, setShowForm] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [ocrResults, setOcrResults] = useState<any[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    vacuna: "",
    otraVacuna: "",
    fechaAplicacion: new Date().toISOString().slice(0, 10),
    dosis: "",
    lote: "",
    proximaDosis: "",
    aplicadoPor: "",
    notas: "",
  })

  const addVaccine = (trpc.vaccine as any).add.useMutation({
    onSuccess: () => {
      ;(utils.vaccine as any).list.invalidate({ patientRegistrationId })
      setShowForm(false)
      toast.success("Vacuna registrada exitosamente")
      setForm({
        vacuna: "",
        otraVacuna: "",
        fechaAplicacion: new Date().toISOString().slice(0, 10),
        dosis: "",
        lote: "",
        proximaDosis: "",
        aplicadoPor: "",
        notas: "",
      })
    },
  })

  const addManyVaccines = (trpc.vaccine as any).addMany.useMutation({
    onSuccess: (res: any) => {
      ;(utils.vaccine as any).list.invalidate({ patientRegistrationId })
      setOcrResults(null)
      toast.success("Vacunas extraídas guardadas exitosamente")
    },
    onError: (err: any) => {
      toast.error(`Error al guardar vacunas: ${err.message}`)
    }
  })

  const removeVaccine = (trpc.vaccine as any).remove.useMutation({
    onSuccess: () => (utils.vaccine as any).list.invalidate({ patientRegistrationId }),
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/ai/vaccine-ocr", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Fallo el procesamiento OCR")
      }

      if (data.data?.vacunas?.length > 0) {
        setOcrResults(data.data.vacunas)
        toast.success(`IA detectó ${data.data.vacunas.length} vacunas en la imagen`)
      } else {
        toast.error("No se detectaron vacunas en la imagen. Intenta con una foto más clara.")
      }
    } catch (err: any) {
      toast.error(err.message || "Error al analizar tarjeta de vacunas")
    } finally {
      setIsScanning(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const vacunaFinal = form.vacuna === "Otra" ? form.otraVacuna : form.vacuna
  const canSubmit = vacunaFinal.trim().length >= 2 && form.fechaAplicacion

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          size="sm"
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={13} className="mr-1" />
          Registrar vacuna
        </Button>

        {/* AI Scanner Button */}
        <Button
          size="sm"
          variant="outline"
          disabled={isScanning}
          onClick={() => fileInputRef.current?.click()}
          className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 shadow-sm"
        >
          {isScanning ? (
            <>
              <Loader2 size={13} className="mr-1.5 animate-spin text-amber-400" />
              Analizando cartilla con IA...
            </>
          ) : (
            <>
              <Camera size={13} className="mr-1.5 text-amber-400" />
              <Sparkles size={11} className="mr-1 text-amber-300" />
              Escanear cartilla con IA
            </>
          )}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* PDF Carnet Download Button - Always Visible */}
        <a
          href={`/api/pdf/vaccine-carnet/${patientRegistrationId}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors shadow-sm"
        >
          <FileDown size={13} />
          Ver / Descargar Carné PDF (con QR)
        </a>
      </div>

      {/* AI OCR Extracted Vaccines Preview Modal / Section */}
      {ocrResults && (
        <div className="rounded-xl border border-amber-500/40 bg-slate-900/90 p-4 space-y-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-amber-300">Vacunas Detectadas por IA ({ocrResults.length})</h4>
            </div>
            <Button size="sm" variant="ghost" className="text-slate-400 text-xs h-7" onClick={() => setOcrResults(null)}>
              Descartar
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {ocrResults.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    className="h-7 text-xs font-bold text-white bg-slate-700 border-slate-600"
                    value={item.vacuna}
                    onChange={(e) => {
                      const updated = [...ocrResults]
                      updated[idx].vacuna = e.target.value
                      setOcrResults(updated)
                    }}
                  />
                  <Input
                    type="date"
                    className="h-7 w-36 text-xs text-slate-200 bg-slate-700 border-slate-600"
                    value={item.fechaAplicacion}
                    onChange={(e) => {
                      const updated = [...ocrResults]
                      updated[idx].fechaAplicacion = e.target.value
                      setOcrResults(updated)
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input
                    placeholder="Dosis (ej: 1ª)"
                    className="h-6 text-[11px] bg-slate-700 border-slate-600 text-slate-300"
                    value={item.dosis || ""}
                    onChange={(e) => {
                      const updated = [...ocrResults]
                      updated[idx].dosis = e.target.value
                      setOcrResults(updated)
                    }}
                  />
                  <Input
                    placeholder="Lote"
                    className="h-6 text-[11px] bg-slate-700 border-slate-600 text-slate-300"
                    value={item.lote || ""}
                    onChange={(e) => {
                      const updated = [...ocrResults]
                      updated[idx].lote = e.target.value
                      setOcrResults(updated)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              disabled={addManyVaccines.isPending}
              onClick={() =>
                addManyVaccines.mutate({
                  patientRegistrationId,
                  vaccines: ocrResults.map((v) => ({
                    vacuna: v.vacuna,
                    fechaAplicacion: v.fechaAplicacion,
                    dosis: v.dosis || undefined,
                    lote: v.lote || undefined,
                    proximaDosis: v.proximaDosis || undefined,
                    aplicadoPor: v.aplicadoPor || undefined,
                    notas: v.notas || undefined,
                  }))
                })
              }
              className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs"
            >
              <CheckCircle2 size={13} className="mr-1" />
              {addManyVaccines.isPending ? "Guardando vacunas..." : "Guardar todas las vacunas extraídas"}
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-slate-300">Vacuna</Label>
              <select
                value={form.vacuna}
                onChange={(e) => setForm((f) => ({ ...f, vacuna: e.target.value }))}
                className="w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white"
              >
                <option value="">— Seleccionar —</option>
                {VACUNAS_VE.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {form.vacuna === "Otra" && (
                <Input
                  className="mt-1 bg-slate-700 border-slate-600 text-white text-sm h-8"
                  placeholder="Nombre de la vacuna"
                  value={form.otraVacuna}
                  onChange={(e) => setForm((f) => ({ ...f, otraVacuna: e.target.value }))}
                />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Fecha de aplicación</Label>
              <Input
                type="date"
                value={form.fechaAplicacion}
                onChange={(e) => setForm((f) => ({ ...f, fechaAplicacion: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white text-sm h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Dosis (ej: 1ª, 2ª, Refuerzo)</Label>
              <Input
                value={form.dosis}
                onChange={(e) => setForm((f) => ({ ...f, dosis: e.target.value }))}
                placeholder="Ej: 1ª dosis"
                className="bg-slate-700 border-slate-600 text-white text-sm h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Lote (opcional)</Label>
              <Input
                value={form.lote}
                onChange={(e) => setForm((f) => ({ ...f, lote: e.target.value }))}
                placeholder="Ej: AX4B82"
                className="bg-slate-700 border-slate-600 text-white text-sm h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Próxima dosis (opcional)</Label>
              <Input
                type="date"
                value={form.proximaDosis}
                onChange={(e) => setForm((f) => ({ ...f, proximaDosis: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white text-sm h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Aplicado por (opcional)</Label>
              <Input
                value={form.aplicadoPor}
                onChange={(e) => setForm((f) => ({ ...f, aplicadoPor: e.target.value }))}
                placeholder="Nombre del profesional"
                className="bg-slate-700 border-slate-600 text-white text-sm h-8"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-slate-300">Notas (opcional)</Label>
              <Input
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                placeholder="Observaciones, reacciones..."
                className="bg-slate-700 border-slate-600 text-white text-sm h-8"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!canSubmit || addVaccine.isPending}
              onClick={() =>
                addVaccine.mutate({
                  patientRegistrationId,
                  vacuna: vacunaFinal,
                  fechaAplicacion: form.fechaAplicacion,
                  dosis: form.dosis || undefined,
                  lote: form.lote || undefined,
                  proximaDosis: form.proximaDosis || undefined,
                  aplicadoPor: form.aplicadoPor || undefined,
                  notas: form.notas || undefined,
                })
              }
              className="bg-emerald-700 hover:bg-emerald-600"
            >
              {addVaccine.isPending ? "Guardando..." : "Guardar vacuna"}
            </Button>
            <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-xs text-slate-500">Cargando...</p>}

      {!isLoading && (vaccines as any[] | undefined)?.length === 0 && (
        <p className="text-xs text-slate-500">No hay vacunas registradas.</p>
      )}

      {(vaccines as any[] | undefined)?.map((v: any) => (
        <div
          key={v.id}
          className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-white">{v.vacuna}</p>
              {v.dosis && (
                <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                  {v.dosis}
                </span>
              )}
              {v.proximaDosis && (
                <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-xs text-amber-300">
                  Próx: {new Date(v.proximaDosis).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(v.fechaAplicacion).toLocaleDateString("es-VE", {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: 'America/Caracas',
              })}
              {v.lote && ` · Lote: ${v.lote}`}
              {v.aplicadoPor && ` · ${v.aplicadoPor}`}
            </p>
            {v.notas && <p className="text-xs text-slate-500 mt-0.5">{v.notas}</p>}
          </div>
          <button
            onClick={() => removeVaccine.mutate({ id: v.id })}
            disabled={removeVaccine.isPending}
            className="shrink-0 text-slate-600 hover:text-red-400 disabled:opacity-50"
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
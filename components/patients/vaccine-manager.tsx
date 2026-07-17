"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Plus, Trash2, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const { data: vaccines, isLoading } = (trpc.vaccine as any).list.useQuery({ patientRegistrationId })

  const [showForm, setShowForm] = useState(false)

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

  const removeVaccine = (trpc.vaccine as any).remove.useMutation({
    onSuccess: () => (utils.vaccine as any).list.invalidate({ patientRegistrationId }),
  })

  const vacunaFinal = form.vacuna === "Otra" ? form.otraVacuna : form.vacuna
  const canSubmit = vacunaFinal.trim().length >= 2 && form.fechaAplicacion

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={13} className="mr-1" />
          Registrar vacuna
        </Button>
        {!!((vaccines as any[]) ?? []).length && (
          <a
            href={`/api/pdf/vaccine-carnet/${patientRegistrationId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            <FileDown size={13} />
            Descargar carné PDF
          </a>
        )}
      </div>

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
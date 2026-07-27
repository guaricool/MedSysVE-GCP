"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Plus, Trash2, FileDown, AlertTriangle, CheckCircle2 } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientRegistrationId: string
  patientNombre: string
  onAllergyChange?: () => void
}

const CATEGORIAS = [
  { value: "FARMACO", label: "Medicamento / Fármaco" },
  { value: "ALIMENTO", label: "Alimento / Dieta" },
  { value: "AEROALERGENO", label: "Aeroalérgeno (Ácaros, Pólenes, Hongos)" },
  { value: "INSECTO", label: "Picadura de Insecto" },
  { value: "CONTACTO", label: "Contacto / Dermatitis (Látex, Níquel)" },
  { value: "OTRO", label: "Otra Sustancia" },
]

const GRAVEDADES = [
  { value: "LEVE", label: "Leve (Rash local / Urticaria)", color: "text-amber-400 bg-amber-950/40 border-amber-800" },
  { value: "MODERADA", label: "Moderada (Angioedema)", color: "text-orange-400 bg-orange-950/40 border-orange-800" },
  { value: "SEVERA", label: "Severa (Anafilaxia / Riesgo vital)", color: "text-red-400 bg-red-950/40 border-red-800" },
]

export function EncounterAllergiesModal({
  open,
  onOpenChange,
  patientRegistrationId,
  patientNombre,
  onAllergyChange,
}: Props) {
  const utils = trpc.useUtils()
  const { data: alergias = [], refetch } = trpc.alergia.list.useQuery(
    { patientRegistrationId },
    { enabled: open && !!patientRegistrationId }
  )

  const addMut = trpc.alergia.add.useMutation({
    onSuccess: () => {
      refetch()
      utils.alergia.list.invalidate({ patientRegistrationId })
      if (onAllergyChange) onAllergyChange()
      setSustancia("")
      setReaccion("")
      setCategoria("FARMACO")
      setGravedad("LEVE")
      setShowForm(false)
    },
  })

  const delMut = trpc.alergia.delete.useMutation({
    onSuccess: () => {
      refetch()
      utils.alergia.list.invalidate({ patientRegistrationId })
      if (onAllergyChange) onAllergyChange()
    },
  })

  const [showForm, setShowForm] = useState(false)
  const [sustancia, setSustancia] = useState("")
  const [reaccion, setReaccion] = useState("")
  const [categoria, setCategoria] = useState<"FARMACO" | "ALIMENTO" | "AEROALERGENO" | "INSECTO" | "CONTACTO" | "OTRO">("FARMACO")
  const [gravedad, setGravedad] = useState<"LEVE" | "MODERADA" | "SEVERA">("LEVE")

  const handleAdd = () => {
    if (!sustancia.trim()) return
    addMut.mutate({
      patientRegistrationId,
      sustancia: sustancia.trim(),
      reaccion: reaccion.trim() || undefined,
      categoria,
      gravedad,
    })
  }

  const activas = alergias.filter((a) => a.activa)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100 p-6 shadow-xl">
        <DialogHeader className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                Gestor de Alergias del Paciente
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {patientNombre} · {activas.length} alergia(s) registrada(s)
              </DialogDescription>
            </div>
          </div>

          <a
            href={`/api/pdf/allergy-report/${patientRegistrationId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-all shadow-sm shrink-0"
          >
            <FileDown size={14} />
            Certificado PDF
          </a>
        </DialogHeader>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Alergias & Sensibilizaciones Activas
          </p>
          {!showForm && (
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Nueva Alergia
            </Button>
          )}
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Nueva Alergia o Sensibilización
              </span>
              <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-white">
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Sustancia / Alérgeno *</label>
                <input
                  type="text"
                  value={sustancia}
                  onChange={(e) => setSustancia(e.target.value)}
                  placeholder="Ej: Penicilina, Dipirona, Blomia, Camarón"
                  className="w-full bg-slate-900 border border-slate-700 text-white font-semibold rounded p-2 text-xs focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Categoría del Alérgeno</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 text-xs focus:border-red-500 focus:outline-none"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Reacción Manifestada</label>
                <input
                  type="text"
                  value={reaccion}
                  onChange={(e) => setReaccion(e.target.value)}
                  placeholder="Ej: Urticaria, Broncoespasmo, Angioedema"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-300 rounded p-2 text-xs focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Gravedad de la Reacción</label>
                <select
                  value={gravedad}
                  onChange={(e) => setGravedad(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded p-2 text-xs focus:border-red-500 focus:outline-none"
                >
                  {GRAVEDADES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!sustancia.trim() || addMut.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
              >
                {addMut.isPending ? "Guardando..." : "Guardar Alergia in situ"}
              </Button>
            </div>
          </div>
        )}

        {/* Allergy List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {activas.length === 0 ? (
            <div className="text-center py-8 bg-slate-950/50 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">El paciente no tiene alergias registradas.</p>
              <p className="text-[11px] text-slate-500">Usa el botón superior para agregar alergias o sensibilizaciones conocidas.</p>
            </div>
          ) : (
            activas.map((a) => (
              <div
                key={a.id}
                className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{a.sustancia}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        a.gravedad === "SEVERA"
                          ? "bg-red-950/80 border-red-500 text-red-300"
                          : a.gravedad === "MODERADA"
                          ? "bg-orange-950/80 border-orange-500 text-orange-300"
                          : "bg-amber-950/80 border-amber-500 text-amber-300"
                      }`}
                    >
                      {a.gravedad}
                    </span>
                    {a.categoria && (
                      <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded">
                        {CATEGORIAS.find((c) => c.value === a.categoria)?.label || a.categoria}
                      </span>
                    )}
                  </div>
                  {a.reaccion && <p className="text-slate-400 text-xs">Reacción: {a.reaccion}</p>}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => delMut.mutate({ id: a.id })}
                  disabled={delMut.isPending}
                  className="text-slate-400 hover:text-red-400 hover:bg-red-950/40 p-1.5 h-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

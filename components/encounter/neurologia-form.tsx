"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Activity, CheckCircle, BrainCircuit } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    glasgow?: {
      aperturaOcular?: number
      respuestaVerbal?: number
      respuestaMotora?: number
    }
    fuerzaMrc?: {
      msd?: number
      msi?: number
      mid?: number
      mii?: number
    }
    reflejos?: {
      bicipital?: string
      tricipital?: string
      rotuliano?: string
      aquileo?: string
    }
    paresCranealesAlterados?: string[]
  }
}

const PARES_CRANEALES = [
  "I (Olfatorio)", "II (Óptico)", "III (Motor Ocular Común)", "IV (Patético/Troclear)",
  "V (Trigémino)", "VI (Motor Ocular Externo/Abducens)", "VII (Facial)",
  "VIII (Vestibuloclear/Auditivo)", "IX (Glosofaríngeo)", "X (Vago/Neumogástrico)",
  "XI (Espinal/Accesorio)", "XII (Hipogloso)"
]

export function NeurologiaForm({ encounterId, disabled, initialData = {} }: Props) {
  const g = initialData.glasgow || {}
  const [aperturaOcular, setAperturaOcular] = useState<number>(g.aperturaOcular || 4)
  const [respuestaVerbal, setRespuestaVerbal] = useState<number>(g.respuestaVerbal || 5)
  const [respuestaMotora, setRespuestaMotora] = useState<number>(g.respuestaMotora || 6)

  const f = initialData.fuerzaMrc || {}
  const [msd, setMsd] = useState<number>(f.msd || 5)
  const [msi, setMsi] = useState<number>(f.msi || 5)
  const [mid, setMid] = useState<number>(f.mid || 5)
  const [mii, setMii] = useState<number>(f.mii || 5)

  const r = initialData.reflejos || {}
  const [bicipital, setBicipital] = useState(r.bicipital || "++")
  const [tricipital, setTricipital] = useState(r.tricipital || "++")
  const [rotuliano, setRotuliano] = useState(r.rotuliano || "++")
  const [aquileo, setAquileo] = useState(r.aquileo || "++")

  const [paresAlterados, setParesAlterados] = useState<string[]>(initialData.paresCranealesAlterados || [])
  const [saved, setSaved] = useState(false)

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return (
      aperturaOcular !== (g.aperturaOcular || 4) ||
      respuestaVerbal !== (g.respuestaVerbal || 5) ||
      respuestaMotora !== (g.respuestaMotora || 6) ||
      msd !== (f.msd || 5) ||
      msi !== (f.msi || 5) ||
      mid !== (f.mid || 5) ||
      mii !== (f.mii || 5) ||
      bicipital !== (r.bicipital || "++") ||
      tricipital !== (r.tricipital || "++") ||
      rotuliano !== (r.rotuliano || "++") ||
      aquileo !== (r.aquileo || "++") ||
      JSON.stringify(paresAlterados) !== JSON.stringify(initialData.paresCranealesAlterados || [])
    )
  }, [aperturaOcular, respuestaVerbal, respuestaMotora, msd, msi, mid, mii, bicipital, tricipital, rotuliano, aquileo, paresAlterados, g, f, r, initialData])

  useEffect(() => {
    setDirty("neurologia", isDirty)
  }, [isDirty, setDirty])

  const utils = trpc.useUtils()
  const save = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const gcsScore = aperturaOcular + respuestaVerbal + respuestaMotora

  function handleSave() {
    const payload = {
      glasgow: {
        aperturaOcular,
        respuestaVerbal,
        respuestaMotora,
      },
      fuerzaMrc: {
        msd,
        msi,
        mid,
        mii,
      },
      reflejos: {
        bicipital,
        tricipital,
        rotuliano,
        aquileo,
      },
      paresCranealesAlterados: paresAlterados,
    }

    save.mutate({
      id: encounterId,
      datosEspecialidad: payload,
    })
  }

  const togglePar = (par: string) => {
    if (disabled) return
    setParesAlterados((prev) =>
      prev.includes(par) ? prev.filter((p) => p !== par) : [...prev, par]
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <BrainCircuit className="h-4 w-4 text-purple-400" />
        Evaluación Neurológica y Fuerza Motora
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Glasgow Scale */}
        <div className="rounded-lg border border-slate-800 bg-slate-800/20 p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Escala de Coma de Glasgow (GCS)
            </h4>
            <span className="text-xs font-bold text-purple-400">Total: {gcsScore}/15</span>
          </div>
          <div className="space-y-2 text-xs">
            <label className="block text-slate-400">
              Apertura Ocular
              <select
                disabled={disabled}
                value={aperturaOcular}
                onChange={(e) => setAperturaOcular(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              >
                <option value={4}>Espontánea (4 pts)</option>
                <option value={3}>A la voz (3 pts)</option>
                <option value={2}>Al dolor (2 pts)</option>
                <option value={1}>Ninguna (1 pt)</option>
              </select>
            </label>

            <label className="block text-slate-400">
              Respuesta Verbal
              <select
                disabled={disabled}
                value={respuestaVerbal}
                onChange={(e) => setRespuestaVerbal(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              >
                <option value={5}>Orientado (5 pts)</option>
                <option value={4}>Confuso (4 pts)</option>
                <option value={3}>Inapropiado (3 pts)</option>
                <option value={2}>Incomprensible (2 pts)</option>
                <option value={1}>Ninguna (1 pt)</option>
              </select>
            </label>

            <label className="block text-slate-400">
              Respuesta Motora
              <select
                disabled={disabled}
                value={respuestaMotora}
                onChange={(e) => setRespuestaMotora(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              >
                <option value={6}>Obedece órdenes (6 pts)</option>
                <option value={5}>Localiza el dolor (5 pts)</option>
                <option value={4}>Retirada al dolor (4 pts)</option>
                <option value={3}>Flexión anormal/decorticación (3 pts)</option>
                <option value={2}>Extensión anormal/descerebración (2 pts)</option>
                <option value={1}>Ninguna (1 pt)</option>
              </select>
            </label>
          </div>
        </div>

        {/* Fuerza Motora y Reflejos */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Fuerza Muscular (MRC 0-5)
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="block text-slate-400">
              Miembro Sup. Der. (MSD)
              <input
                type="number"
                min={0}
                max={5}
                disabled={disabled}
                value={msd}
                onChange={(e) => setMsd(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
            <label className="block text-slate-400">
              Miembro Sup. Izq. (MSI)
              <input
                type="number"
                min={0}
                max={5}
                disabled={disabled}
                value={msi}
                onChange={(e) => setMsi(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
            <label className="block text-slate-400">
              Miembro Inf. Der. (MID)
              <input
                type="number"
                min={0}
                max={5}
                disabled={disabled}
                value={mid}
                onChange={(e) => setMid(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
            <label className="block text-slate-400">
              Miembro Inf. Izq. (MII)
              <input
                type="number"
                min={0}
                max={5}
                disabled={disabled}
                value={mii}
                onChange={(e) => setMii(Number(e.target.value))}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
          </div>

          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide pt-2">
            Reflejos Osteotendinosos
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="block text-slate-400">
              Bicipital
              <input
                type="text"
                disabled={disabled}
                placeholder="Ej. ++"
                value={bicipital}
                onChange={(e) => setBicipital(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
            <label className="block text-slate-400">
              Tricipital
              <input
                type="text"
                disabled={disabled}
                placeholder="Ej. ++"
                value={tricipital}
                onChange={(e) => setTricipital(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
            <label className="block text-slate-400">
              Rotuliano
              <input
                type="text"
                disabled={disabled}
                placeholder="Ej. ++"
                value={rotuliano}
                onChange={(e) => setRotuliano(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
            <label className="block text-slate-400">
              Aquileo
              <input
                type="text"
                disabled={disabled}
                placeholder="Ej. ++"
                value={aquileo}
                onChange={(e) => setAquileo(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white"
              />
            </label>
          </div>
        </div>

        {/* Pares Craneales Alterados */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Alteración de Pares Craneales
          </h4>
          <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
            {PARES_CRANEALES.map((par) => {
              const active = paresAlterados.includes(par)
              return (
                <button
                  key={par}
                  type="button"
                  disabled={disabled}
                  onClick={() => togglePar(par)}
                  className={`w-full text-left rounded px-2 py-1 text-[11px] border transition-colors flex items-center justify-between ${
                    active
                      ? "bg-purple-950/30 border-purple-700 text-purple-300 font-semibold"
                      : "border-slate-800 bg-slate-900 text-slate-500 hover:text-white"
                  }`}
                >
                  <span>{par}</span>
                  {active && <span className="text-[10px] text-purple-400 font-bold shrink-0 ml-1">ALTERADO</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {!disabled && (
        <div className="flex items-center gap-3 border-t border-slate-800 pt-3">
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="rounded bg-purple-700 px-4 py-1.5 text-xs text-white hover:bg-purple-600 disabled:opacity-50 font-semibold"
          >
            {save.isPending ? "Guardando..." : "Guardar Neurología"}
          </button>
          {saved && (
            <p className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" /> Guardado.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

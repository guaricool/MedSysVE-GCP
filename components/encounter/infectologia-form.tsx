"use client"

import { useState, useMemo, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { ShieldAlert, CheckCircle, Plus, Trash2, Activity, Globe } from "lucide-react"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"

interface Antimicrobiano {
  farmaco: string
  dosis: string
  dot: string // Days of Therapy
  motivo: string
}

interface Props {
  encounterId: string
  disabled?: boolean
  initialData?: {
    qsofa?: {
      respiracion?: boolean
      mental?: boolean
      presion?: boolean
    }
    sirs?: {
      temperatura?: boolean
      cardiaca?: boolean
      respiratoria?: boolean
      leucocitos?: boolean
    }
    cronicos?: {
      vihCv?: string
      vihCd4?: string
      hepCv?: string
      tbcBk?: string
    }
    antimicrobianos?: Antimicrobiano[]
    epidemiologia?: {
      viajes?: string
      vacunas?: string
    }
  }
}

export function InfectologiaForm({ encounterId, disabled, initialData = {} }: Props) {
  const iQ = initialData.qsofa || {}
  const [qsofa, setQsofa] = useState({
    respiracion: iQ.respiracion || false,
    mental: iQ.mental || false,
    presion: iQ.presion || false,
  })

  const iS = initialData.sirs || {}
  const [sirs, setSirs] = useState({
    temperatura: iS.temperatura || false,
    cardiaca: iS.cardiaca || false,
    respiratoria: iS.respiratoria || false,
    leucocitos: iS.leucocitos || false,
  })

  const iC = initialData.cronicos || {}
  const [cronicos, setCronicos] = useState({
    vihCv: iC.vihCv || "",
    vihCd4: iC.vihCd4 || "",
    hepCv: iC.hepCv || "",
    tbcBk: iC.tbcBk || "",
  })

  const [antimicrobianos, setAntimicrobianos] = useState<Antimicrobiano[]>(
    initialData.antimicrobianos || []
  )

  const iE = initialData.epidemiologia || {}
  const [epidemiologia, setEpidemiologia] = useState({
    viajes: iE.viajes || "",
    vacunas: iE.vacunas || "",
  })

  const [saved, setSaved] = useState(false)
  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(qsofa) !== JSON.stringify({
        respiracion: iQ.respiracion || false,
        mental: iQ.mental || false,
        presion: iQ.presion || false,
      }) ||
      JSON.stringify(sirs) !== JSON.stringify({
        temperatura: iS.temperatura || false,
        cardiaca: iS.cardiaca || false,
        respiratoria: iS.respiratoria || false,
        leucocitos: iS.leucocitos || false,
      }) ||
      JSON.stringify(cronicos) !== JSON.stringify({
        vihCv: iC.vihCv || "",
        vihCd4: iC.vihCd4 || "",
        hepCv: iC.hepCv || "",
        tbcBk: iC.tbcBk || "",
      }) ||
      JSON.stringify(antimicrobianos) !== JSON.stringify(initialData.antimicrobianos || []) ||
      JSON.stringify(epidemiologia) !== JSON.stringify({
        viajes: iE.viajes || "",
        vacunas: iE.vacunas || "",
      })
    )
  }, [qsofa, sirs, cronicos, antimicrobianos, epidemiologia, iQ, iS, iC, iE, initialData])

  useEffect(() => {
    setDirty("infectologia", isDirty)
  }, [isDirty, setDirty])

  const utils = trpc.useUtils()
  const save = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.invalidate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  function handleSave() {
    save.mutate({
      id: encounterId,
      datosEspecialidad: { qsofa, sirs, cronicos, antimicrobianos, epidemiologia },
    })
  }

  const qsofaScore = (qsofa.respiracion ? 1 : 0) + (qsofa.mental ? 1 : 0) + (qsofa.presion ? 1 : 0)
  const sirsScore = (sirs.temperatura ? 1 : 0) + (sirs.cardiaca ? 1 : 0) + (sirs.respiratoria ? 1 : 0) + (sirs.leucocitos ? 1 : 0)

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="flex items-center gap-2 font-medium text-slate-200">
          <ShieldAlert className="h-4 w-4 text-emerald-400" />
          Control de Infecciones y Escalas (Infectología)
        </h3>
        <button
          onClick={handleSave}
          disabled={disabled || save.isPending || !isDirty}
          className="flex h-8 items-center gap-2 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" /> Guardado
            </>
          ) : (
            "Guardar Evaluación"
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6 border-r border-slate-800 pr-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-400" />
                Escala qSOFA (Sepsis)
              </h4>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${qsofaScore >= 2 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                {qsofaScore} / 3
              </span>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={qsofa.respiracion} onChange={(e) => setQsofa({ ...qsofa, respiracion: e.target.checked })} disabled={disabled} className="rounded border-slate-700 bg-slate-800 text-rose-500" />
                <span className="text-xs text-slate-300">FR ≥ 22 rpm</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={qsofa.mental} onChange={(e) => setQsofa({ ...qsofa, mental: e.target.checked })} disabled={disabled} className="rounded border-slate-700 bg-slate-800 text-rose-500" />
                <span className="text-xs text-slate-300">Alteración mental (Glasgow {"<"} 15)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={qsofa.presion} onChange={(e) => setQsofa({ ...qsofa, presion: e.target.checked })} disabled={disabled} className="rounded border-slate-700 bg-slate-800 text-rose-500" />
                <span className="text-xs text-slate-300">PAS ≤ 100 mmHg</span>
              </label>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-300">Criterios SIRS</h4>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sirsScore >= 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
                {sirsScore} / 4
              </span>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sirs.temperatura} onChange={(e) => setSirs({ ...sirs, temperatura: e.target.checked })} disabled={disabled} className="rounded border-slate-700 bg-slate-800 text-orange-500" />
                <span className="text-xs text-slate-300">Temp {">"} 38°C o {"<"} 36°C</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sirs.cardiaca} onChange={(e) => setSirs({ ...sirs, cardiaca: e.target.checked })} disabled={disabled} className="rounded border-slate-700 bg-slate-800 text-orange-500" />
                <span className="text-xs text-slate-300">FC {">"} 90 lpm</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sirs.respiratoria} onChange={(e) => setSirs({ ...sirs, respiratoria: e.target.checked })} disabled={disabled} className="rounded border-slate-700 bg-slate-800 text-orange-500" />
                <span className="text-xs text-slate-300">FR {">"} 20 rpm o PaCO2 {"<"} 32</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sirs.leucocitos} onChange={(e) => setSirs({ ...sirs, leucocitos: e.target.checked })} disabled={disabled} className="rounded border-slate-700 bg-slate-800 text-orange-500" />
                <span className="text-xs text-slate-300">GB {">"} 12,000 o {"<"} 4,000 o {">"} 10% bandas</span>
              </label>
            </div>
          </div>
          
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" />
              Epidemiología
            </h4>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Viajes Recientes</label>
                <input type="text" value={epidemiologia.viajes} onChange={(e) => setEpidemiologia({ ...epidemiologia, viajes: e.target.value })} disabled={disabled} placeholder="Zonas endémicas..." className="w-full rounded border-slate-700 bg-slate-800/50 text-xs text-slate-200" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Vacunación Especial</label>
                <input type="text" value={epidemiologia.vacunas} onChange={(e) => setEpidemiologia({ ...epidemiologia, vacunas: e.target.value })} disabled={disabled} placeholder="Fiebre amarilla, Neumococo, etc." className="w-full rounded border-slate-700 bg-slate-800/50 text-xs text-slate-200" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-300">Control Antimicrobiano (Stewardship)</h4>
              <button
                type="button"
                onClick={() => setAntimicrobianos([...antimicrobianos, { farmaco: "", dosis: "", dot: "", motivo: "" }])}
                disabled={disabled}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar
              </button>
            </div>
            
            <div className="space-y-2">
              {antimicrobianos.map((anti, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-slate-800/30 p-2 rounded border border-slate-800">
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <input type="text" placeholder="Fármaco" value={anti.farmaco} onChange={(e) => { const n = [...antimicrobianos]; n[idx].farmaco = e.target.value; setAntimicrobianos(n); }} disabled={disabled} className="rounded border-slate-700 bg-slate-800 text-xs" />
                    <input type="text" placeholder="Dosis" value={anti.dosis} onChange={(e) => { const n = [...antimicrobianos]; n[idx].dosis = e.target.value; setAntimicrobianos(n); }} disabled={disabled} className="rounded border-slate-700 bg-slate-800 text-xs" />
                    <input type="text" placeholder="Motivo/Infección" value={anti.motivo} onChange={(e) => { const n = [...antimicrobianos]; n[idx].motivo = e.target.value; setAntimicrobianos(n); }} disabled={disabled} className="rounded border-slate-700 bg-slate-800 text-xs" />
                    <input type="text" placeholder="Días (DOT)" value={anti.dot} onChange={(e) => { const n = [...antimicrobianos]; n[idx].dot = e.target.value; setAntimicrobianos(n); }} disabled={disabled} className="rounded border-slate-700 bg-slate-800 text-xs" />
                  </div>
                  <button type="button" onClick={() => setAntimicrobianos(antimicrobianos.filter((_, i) => i !== idx))} disabled={disabled} className="text-slate-500 hover:text-red-400 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {antimicrobianos.length === 0 && (
                <p className="text-xs text-slate-500 italic">No hay antimicrobianos registrados en la consulta.</p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-sm font-medium text-slate-300">Marcadores Crónicos Específicos</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">VIH - Carga Viral</label>
                <input type="text" value={cronicos.vihCv} onChange={(e) => setCronicos({ ...cronicos, vihCv: e.target.value })} disabled={disabled} className="w-full rounded border-slate-700 bg-slate-800 text-xs text-slate-200" placeholder="Ej: < 20 copias" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">VIH - CD4</label>
                <input type="text" value={cronicos.vihCd4} onChange={(e) => setCronicos({ ...cronicos, vihCd4: e.target.value })} disabled={disabled} className="w-full rounded border-slate-700 bg-slate-800 text-xs text-slate-200" placeholder="Ej: 540 cel/mm3" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Hepatitis - Carga Viral</label>
                <input type="text" value={cronicos.hepCv} onChange={(e) => setCronicos({ ...cronicos, hepCv: e.target.value })} disabled={disabled} className="w-full rounded border-slate-700 bg-slate-800 text-xs text-slate-200" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">TBC - Baciloscopia</label>
                <input type="text" value={cronicos.tbcBk} onChange={(e) => setCronicos({ ...cronicos, tbcBk: e.target.value })} disabled={disabled} className="w-full rounded border-slate-700 bg-slate-800 text-xs text-slate-200" placeholder="Negativo / Positivo" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

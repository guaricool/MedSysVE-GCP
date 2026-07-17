"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"


interface AntecedentesJson {
  personal?: {
    hipertension?: boolean
    diabetes?: boolean
    cardiopatia?: boolean
    asma?: boolean
    epilepsia?: boolean
    cancer?: boolean
    otros?: string
  }
  familiares?: {
    hipertension?: boolean
    diabetes?: boolean
    cardiopatia?: boolean
    otros?: string
  }
  habitos?: { fumador?: boolean; alcohol?: boolean; drogas?: boolean; otros?: string }
  quirurgicos?: string
  ginecologicos?: string
}

function merge(base: AntecedentesJson, patch: Partial<AntecedentesJson>): AntecedentesJson {
  return { ...base, ...patch }
}

export function AntecedentesClient({
  patientRegistrationId,
  initialData,
}: {
  patientRegistrationId: string
  initialData?: AntecedentesJson | null
}) {
  const [data, setData] = useState<AntecedentesJson>(initialData ?? {})
  const [saved, setSaved] = useState(false)

  const update = trpc.patient.updateAntecedentes.useMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  function setPersonal(key: keyof NonNullable<AntecedentesJson["personal"]>, val: boolean | string) {
    setData((d) => merge(d, { personal: { ...d.personal, [key]: val } }))
  }
  function setFamiliares(key: keyof NonNullable<AntecedentesJson["familiares"]>, val: boolean | string) {
    setData((d) => merge(d, { familiares: { ...d.familiares, [key]: val } }))
  }
  function setHabitos(key: keyof NonNullable<AntecedentesJson["habitos"]>, val: boolean | string) {
    setData((d) => merge(d, { habitos: { ...d.habitos, [key]: val } }))
  }

  const CheckRow = ({
    label,
    checked,
    onChange,
  }: {
    label: string
    checked?: boolean
    onChange: (v: boolean) => void
  }) => (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-600 bg-slate-800 accent-blue-500"
      />
      {label}
    </label>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Personales</p>
          <CheckRow label="Hipertensión" checked={data.personal?.hipertension} onChange={(v) => setPersonal("hipertension", v)} />
          <CheckRow label="Diabetes" checked={data.personal?.diabetes} onChange={(v) => setPersonal("diabetes", v)} />
          <CheckRow label="Cardiopatía" checked={data.personal?.cardiopatia} onChange={(v) => setPersonal("cardiopatia", v)} />
          <CheckRow label="Asma" checked={data.personal?.asma} onChange={(v) => setPersonal("asma", v)} />
          <CheckRow label="Epilepsia" checked={data.personal?.epilepsia} onChange={(v) => setPersonal("epilepsia", v)} />
          <CheckRow label="Cáncer" checked={data.personal?.cancer} onChange={(v) => setPersonal("cancer", v)} />
          <input
            placeholder="Otros..."
            value={data.personal?.otros ?? ""}
            onChange={(e) => setPersonal("otros", e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white mt-1"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Familiares</p>
          <CheckRow label="Hipertensión" checked={data.familiares?.hipertension} onChange={(v) => setFamiliares("hipertension", v)} />
          <CheckRow label="Diabetes" checked={data.familiares?.diabetes} onChange={(v) => setFamiliares("diabetes", v)} />
          <CheckRow label="Cardiopatía" checked={data.familiares?.cardiopatia} onChange={(v) => setFamiliares("cardiopatia", v)} />
          <input
            placeholder="Otros..."
            value={data.familiares?.otros ?? ""}
            onChange={(e) => setFamiliares("otros", e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white mt-1"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Hábitos</p>
          <CheckRow label="Fumador" checked={data.habitos?.fumador} onChange={(v) => setHabitos("fumador", v)} />
          <CheckRow label="Alcohol" checked={data.habitos?.alcohol} onChange={(v) => setHabitos("alcohol", v)} />
          <CheckRow label="Sustancias" checked={data.habitos?.drogas} onChange={(v) => setHabitos("drogas", v)} />
          <input
            placeholder="Otros..."
            value={data.habitos?.otros ?? ""}
            onChange={(e) => setHabitos("otros", e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white mt-1"
          />

          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-3">Quirúrgicos</p>
          <textarea
            rows={2}
            placeholder="Cirugías previas..."
            value={data.quirurgicos ?? ""}
            onChange={(e) => setData((d) => merge(d, { quirurgicos: e.target.value }))}
            className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white resize-none"
          />

          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gineco-obstétricos</p>
          <textarea
            rows={2}
            placeholder="Embarazos, partos, abortos..."
            value={data.ginecologicos ?? ""}
            onChange={(e) => setData((d) => merge(d, { ginecologicos: e.target.value }))}
            className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1 border-t border-slate-800">
        <button
          onClick={() => update.mutate({ patientRegistrationId, antecedentes: data })}
          disabled={update.isPending}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {update.isPending ? "Guardando..." : "Guardar antecedentes"}
        </button>
        {saved && <span className="text-xs text-emerald-400">✓ Guardado</span>}
      </div>
    </div>
  )
}

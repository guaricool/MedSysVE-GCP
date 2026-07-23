"use client"

import { trpc } from "@/lib/trpc-client"
import { GrowthChart } from "./growth-chart"
import { Baby, TrendingUp, Info, FileDown } from "lucide-react"
import { differenceInYears } from "date-fns"

const PAI_VENEZUELA: { edad: string; vacunas: string[] }[] = [
  { edad: "Recién nacido", vacunas: ["BCG", "Hepatitis B (1ª)"] },
  { edad: "2 meses", vacunas: ["Pentavalente (1ª)", "VPI (1ª)", "Rotavirus (1ª)", "Neumococo (1ª)"] },
  { edad: "4 meses", vacunas: ["Pentavalente (2ª)", "VPI (2ª)", "Rotavirus (2ª)", "Neumococo (2ª)"] },
  { edad: "6 meses", vacunas: ["Pentavalente (3ª)", "VOP (3ª)", "Rotavirus (3ª)", "Hepatitis B (3ª)"] },
  { edad: "12 meses", vacunas: ["SRP (1ª)", "Neumococo (refuerzo)", "Fiebre Amarilla"] },
  { edad: "15-18 meses", vacunas: ["Pentavalente (refuerzo)", "VOP (refuerzo)"] },
  { edad: "4-6 años", vacunas: ["SRP (2ª)", "DPT (refuerzo)", "VOP (refuerzo)"] },
  { edad: "11-13 años", vacunas: ["VPH", "dTpa"] },
]

interface Props {
  patientRegistrationId: string
  fechaNacimiento: string | Date
  sexo: string
}

export function PediatricPanel({ patientRegistrationId, fechaNacimiento, sexo }: Props) {
  const edad = differenceInYears(new Date(), new Date(fechaNacimiento))
  if (edad >= 18) return null

  // Use the same vitals source the historical chart uses, so the growth
  // chart on this panel reflects every consultation where peso/talla were
  // recorded. The previous code attempted a conditional hook call which is
  // both a React-rules violation AND silently fell back to {data:[]} every
  // render, which is why the chart was always empty.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: vitals = [] } = (trpc as any).analytics?.patientVitals?.useQuery(
    { patientRegistrationId },
  ) ?? { data: [] }

  const { data: vaccines = [] } = trpc.vaccine.list.useQuery({ patientRegistrationId })

  const vaccinedNames = new Set(
    (vaccines as { vacuna: string }[]).map((v) => v.vacuna.toLowerCase())
  )

  const vitalsArr = (vitals as Array<{ fecha?: string | Date; createdAt?: string | Date; peso?: number | null; talla?: number | null }>) ?? []
  const pesoCount = vitalsArr.filter((v) => v.peso != null).length
  const tallaCount = vitalsArr.filter((v) => v.talla != null).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Baby className="h-4 w-4 text-pink-400" />
          Módulo Pediátrico
          <span className="ml-1 rounded-full bg-pink-900/50 px-2 py-0.5 text-[10px] font-normal text-pink-300">
            {edad} años
          </span>
        </h3>
        <a
          href={`/api/pdf/vaccine-carnet/${patientRegistrationId}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors shadow-sm"
        >
          <FileDown size={13} />
          Carné de Vacunación PDF (con QR)
        </a>
      </div>

      {/* Growth chart */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">Curva de crecimiento</span>
          <span className="ml-auto text-[10px] text-slate-500">
            {pesoCount} peso · {tallaCount} talla
          </span>
        </div>
        {vitalsArr.length === 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-dashed border-slate-800 bg-slate-900/30 p-3 text-xs text-slate-500">
            <Info size={14} className="mt-0.5 shrink-0 text-slate-600" />
            <span>
              Aún no hay peso ni talla registrados. Se llenarán automáticamente al
              tomar signos vitales dentro de una consulta.
            </span>
          </div>
        ) : (
          <GrowthChart
            vitals={vitalsArr.map((v) => ({
              fecha: v.fecha ?? v.createdAt ?? new Date(),
              peso: v.peso ?? null,
              talla: v.talla ?? null,
              fechaNacimiento,
            }))}
            fechaNacimiento={fechaNacimiento}
            sexo={sexo}
          />
        )}
      </div>

      {/* PAI Venezuela schedule */}
      <div>
        <p className="text-xs font-semibold text-slate-300 mb-2">
          Esquema PAI Venezuela
        </p>
        <div className="space-y-1">
          {PAI_VENEZUELA.map((grupo) => {
            const covered = grupo.vacunas.filter((v) =>
              vaccinedNames.has(v.toLowerCase().split(" (")[0].toLowerCase())
            )
            const allCovered = covered.length === grupo.vacunas.length
            return (
              <div
                key={grupo.edad}
                className={`rounded border px-3 py-2 text-xs ${
                  allCovered
                    ? "border-emerald-800/50 bg-emerald-950/20"
                    : "border-slate-800 bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-300">{grupo.edad}</span>
                  <span className={`text-[10px] ${allCovered ? "text-emerald-400" : "text-slate-500"}`}>
                    {covered.length}/{grupo.vacunas.length}
                  </span>
                </div>
                <p className="mt-0.5 text-slate-500">{grupo.vacunas.join(" · ")}</p>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[10px] text-slate-600">
          El estado de cobertura se calcula comparando con las vacunas registradas en el expediente.
        </p>
      </div>
    </div>
  )
}

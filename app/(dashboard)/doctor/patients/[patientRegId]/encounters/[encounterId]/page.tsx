import { notFound } from "next/navigation"
import { createServerCaller } from "@/server/caller"
import { EncounterHeader } from "@/components/encounter/encounter-header"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { UnsavedChangesProvider } from "@/components/providers/unsaved-changes-provider"

const EncounterWorkspace = dynamic(
  () => import("@/components/encounter/encounter-workspace").then((m) => m.EncounterWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-950 border border-slate-800 p-12 rounded-xl text-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
        <p className="text-sm font-semibold text-slate-300">Cargando Historia Clínica & Módulos Especializados...</p>
      </div>
    ),
  }
)
import { differenceInYears } from "date-fns"
import type { Vitales } from "@/lib/clinical/vitals-alerts"

function splitPlan(plan: string | null | undefined): {
  plan: string
  recomendaciones: string
} {
  if (!plan) return { plan: "", recomendaciones: "" }
  const marker = "--- Recomendaciones ---"
  const idx = plan.indexOf(marker)
  if (idx < 0) return { plan, recomendaciones: "" }
  return {
    plan: plan.slice(0, idx).trimEnd(),
    recomendaciones: plan.slice(idx + marker.length).trim(),
  }
}

export default async function EncounterPage({
  params,
}: {
  params: Promise<{ patientRegId: string; encounterId: string }>
}) {
  const { patientRegId, encounterId } = await params
  const caller = await createServerCaller()

  const [reg, enc] = await Promise.all([
    caller.patient.getRegistration({ id: patientRegId }).catch(() => null),
    caller.encounter.get({ id: encounterId }).catch(() => null),
  ])

  if (!reg) notFound()
  if (!enc) notFound()
  if (enc.patientRegistrationId !== patientRegId) notFound()

  const nombre = `${reg.patient.nombre} ${reg.patient.apellido}`
  const edad = differenceInYears(new Date(), new Date(reg.patient.fechaNacimiento))
  const medsCount = enc.prescriptions.flatMap((p: any) => p.items).length
  const vitales = enc.vitales as Vitales | null
  const { plan, recomendaciones } = splitPlan(enc.plan)

  // Fetch allergies for workspace context
  const alergias = await caller.alergia
    .list({ patientRegistrationId: patientRegId })
    .catch(() => [])

  return (
    <UnsavedChangesProvider>
      <div className="flex min-h-screen flex-col bg-slate-950">
        <EncounterHeader
          nombre={nombre}
          edad={edad}
          idDisplay={reg.idDisplay}
          medsActivasCount={medsCount}
          grupoSanguineo={reg.patient.grupoSanguineo ?? undefined}
        />

        <EncounterWorkspace
        encounterId={encounterId}
        patientRegId={patientRegId}
        initialStatus={enc.status}
        initialVitales={vitales ?? undefined}
        initialMotivo={enc.motivo ?? undefined}
        initialHistoriaClinica={enc.historiaClinica ?? undefined}
        initialExamenFisico={typeof enc.examenFisico === "string" ? enc.examenFisico : undefined}
        initialPlan={plan || undefined}
        initialRecomendaciones={recomendaciones || undefined}
        patientNombre={nombre}
        patientEdad={edad}
        patientAlergias={alergias.map((a: any) => ({
          sustancia: a.sustancia,
          gravedad: a.gravedad,
          reaccion: a.reaccion,
        }))}
        patientCronicos={[]}
      />
      </div>
    </UnsavedChangesProvider>
  )
}
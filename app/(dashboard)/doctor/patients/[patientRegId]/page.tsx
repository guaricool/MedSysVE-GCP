import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createServerCaller } from "@/server/caller"
import { EncounterHeader } from "@/components/encounter/encounter-header"
import { Button } from "@/components/ui/button"
import { AccordionSection } from "@/components/ui/accordion-section"
import { PortalAccess } from "@/components/patients/portal-access"
import { ExportHistoryButton } from "@/components/patients/export-history-button"
import { LabResultsClient } from "@/components/patients/lab-results-client"
import { LabResultTrends } from "@/components/patients/lab-result-trends"
import { PatientNotes } from "@/components/patients/patient-notes"
import { PatientAppointments } from "@/components/patients/patient-appointments"
import { VitalsChart } from "@/components/patients/vitals-chart"
import { AllergiesClient } from "@/components/patients/allergies-client"
import { AntecedentesClient } from "@/components/patients/antecedentes-client"
import { PatientTags } from "@/components/patients/patient-tags"
import { BloodTypeEditor } from "@/components/patients/blood-type-editor"
import { VaccineManager } from "@/components/patients/vaccine-manager"
import { InsuranceManager } from "@/components/insurance/insurance-manager"
import { ConsentManager } from "@/components/consent/consent-manager"
import { PediatricPanel } from "@/components/patients/pediatric-panel"
import { differenceInYears } from "date-fns"
import { auth } from "@/lib/auth"
import type { SessionUser } from "@/types"
import { EditPatientModal } from "@/components/patients/edit-patient-modal"
import { DeletePatientModal } from "@/components/patients/delete-patient-modal"
import { CrossWorkspaceHistory } from "@/components/patients/cross-workspace-history"

export default async function PatientHistoryPage({
  params,
}: {
  params: Promise<{ patientRegId: string }>
}) {
  const { patientRegId } = await params
  const session = await auth()
  const user = session?.user as SessionUser | undefined
  if (!user) redirect("/login")

  const caller = await createServerCaller()
  const reg = await caller.patient.getRegistration({ id: patientRegId }).catch(() => null)
  if (!reg) notFound()

  const encounters = await caller.encounter.list({ patientRegistrationId: patientRegId })

  const nombre = `${reg.patient.nombre} ${reg.patient.apellido}`
  const edad = differenceInYears(new Date(), new Date(reg.patient.fechaNacimiento))
  const totalItems = 0

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <EncounterHeader
        nombre={nombre}
        edad={edad}
        idDisplay={reg.idDisplay}
        medsActivasCount={totalItems}
        grupoSanguineo={reg.patient.grupoSanguineo ?? undefined}
      />

      <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
        {/* Patient summary */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 relative">
          {user.role === "DOCTOR" && (
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <EditPatientModal 
                patientId={reg.patient.id} 
                initialData={{
                  telefono: reg.patient.telefono,
                  email: reg.patient.email,
                  direccion: (reg.patient as any).direccion ?? null
                }} 
              />
              <DeletePatientModal 
                patientId={reg.patient.id} 
                patientName={nombre} 
              />
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-slate-300 pr-40">
            <div>
              <span className="text-slate-500">ID Consultorio:</span>{" "}
              <span className="font-mono text-blue-400">#{reg.idDisplay}</span>
            </div>
            <div>
              <span className="text-slate-500">Sexo:</span>{" "}
              {reg.patient.sexo === "MASCULINO" ? "Masculino" : reg.patient.sexo === "FEMENINO" ? "Femenino" : "Otro"}
            </div>
            {reg.patient.telefono && (
              <div>
                <span className="text-slate-500">Tel:</span> {reg.patient.telefono}
              </div>
            )}
            {(reg.patient as any).direccion && (
              <div className="w-full mt-1">
                <span className="text-slate-500">Dirección:</span> {(reg.patient as any).direccion}
              </div>
            )}
            {reg.patient.sinCedula && (
              <div>
                <span className="rounded bg-amber-900/40 px-2 py-0.5 text-xs text-amber-400">
                  Menor — sin cédula
                </span>
              </div>
            )}
            {!reg.patient.sinCedula && reg.patient.numeroIdentificacion && (
              <div>
                <span className="text-slate-500">C.I.:</span>{" "}
                {reg.patient.tipoIdentificacion?.replace("CEDULA_", "")}
                {"-"}
                {reg.patient.numeroIdentificacion}
              </div>
            )}
          </div>
        </div>

        {/* Consultas + Nueva consulta — shown FIRST */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">
              Consultas ({encounters.length})
            </h2>
            {user.role === "DOCTOR" && (
              <form action={nuevaConsulta.bind(null, patientRegId)}>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  + Nueva consulta
                </Button>
              </form>
            )}
          </div>

          {encounters.length === 0 ? (
            <p className="text-slate-400 text-sm">Sin consultas registradas.</p>
          ) : (
            <ul className="space-y-2">
              {encounters.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/doctor/patients/${patientRegId}/encounters/${e.id}`}
                    className="block rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{e.motivo ?? "Consulta"}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            e.status === "SIGNED"
                              ? "bg-emerald-900/40 text-emerald-400"
                              : e.status === "AMENDED"
                                ? "bg-blue-900/40 text-blue-400"
                                : "bg-amber-900/40 text-amber-400"
                          }`}
                        >
                          {e.status === "DRAFT" ? "Borrador" : e.status === "SIGNED" ? "Firmada" : "Enmendada"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(e.createdAt).toLocaleDateString("es-VE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            timeZone: "America/Caracas",
                          })}
                        </span>
                      </div>
                    </div>
                    {e.diagnoses.length > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        {e.diagnoses.map((d) => `${d.codigoCie10} — ${d.descripcion}`).join(" | ")}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          
          {/* Consultas en otros consultorios del mismo doctor */}
          <CrossWorkspaceHistory patientRegistrationId={patientRegId} />
        </div>

        {/* Blood type */}
        <AccordionSection title="Grupo Sanguíneo" icon="🩸" defaultOpen={false}>
          <BloodTypeEditor patientId={reg.patient.id} initialValue={reg.patient.grupoSanguineo ?? null} />
        </AccordionSection>

        {/* Patient tags */}
        <AccordionSection title="Etiquetas del paciente" icon="🏷️" defaultOpen={false}>
          <PatientTags patientRegistrationId={patientRegId} />
        </AccordionSection>

        {/* Allergies */}
        <AccordionSection title="Alergias" icon="🚨" defaultOpen={false}>
          <AllergiesClient patientRegistrationId={patientRegId} />
        </AccordionSection>

        {/* Vaccines */}
        <AccordionSection title="Vacunas" icon="💉" defaultOpen={false}>
          <VaccineManager patientRegistrationId={patientRegId} />
        </AccordionSection>

        {/* Insurance / HMO */}
        <AccordionSection title="Seguro médico (HMO)" icon="🛡️" defaultOpen={false}>
          <InsuranceManager patientRegistrationId={patientRegId} />
        </AccordionSection>

        {/* Consentimientos */}
        <AccordionSection title="Consentimientos firmados" icon="📋" defaultOpen={false}>
          <ConsentManager patientRegistrationId={patientRegId} />
        </AccordionSection>

        {/* Módulo Pediátrico — only renders for patients under 18 */}
        <AccordionSection title="Módulo pediátrico" icon="👶" defaultOpen={false}>
          <PediatricPanel
            patientRegistrationId={patientRegId}
            fechaNacimiento={reg.patient.fechaNacimiento}
            sexo={reg.patient.sexo}
          />
        </AccordionSection>

        {/* Vital signs trends */}
        <AccordionSection title="Signos Vitales (histórico)" icon="❤️" defaultOpen={false}>
          <VitalsChart patientRegistrationId={patientRegId} />
        </AccordionSection>

        {/* Medical history */}
        <AccordionSection title="Antecedentes médicos" icon="📜" defaultOpen={false}>
          <AntecedentesClient
            patientRegistrationId={patientRegId}
            initialData={(reg as any).antecedentes ?? null}
          />
        </AccordionSection>

        {/* Portal access */}
        {user.role === "DOCTOR" && (
          <AccordionSection title="Acceso portal del paciente" icon="🔐" defaultOpen={false}>
            <PortalAccess
              patientId={reg.patient.id}
              hasAccess={reg.hasPortalAccess}
              patientEmail={reg.patient.email}
            />
          </AccordionSection>
        )}

        {/* Internal notes */}
        <AccordionSection title="Notas internas" icon="📝" defaultOpen={false}>
          <PatientNotes
            patientRegistrationId={patientRegId}
            initialNotes={reg.notasInternas ?? null}
          />
        </AccordionSection>

        {/* Export history PDF */}
        {user.role === "DOCTOR" && (
          <AccordionSection title="Historial clínico completo (PDF)" icon="📥" defaultOpen={false}>
            <p className="mb-2 text-xs text-slate-500">
              Genera un PDF con todas las consultas, diagnósticos y medicamentos.
            </p>
            <ExportHistoryButton patientRegistrationId={patientRegId} />
          </AccordionSection>
        )}

        {/* Lab results — view only from the patient history page. To register
            a new result, open a consultation and use the in-encounter form. */}
        <AccordionSection title="Resultados de laboratorio" icon="🧪" defaultOpen={false}>
          <LabResultsClient
            patientRegistrationId={patientRegId}
            role={user.role}
            allowAdd={false}
          />
        </AccordionSection>

        {/* Lab result trends (only shown when 2+ results with same title) */}
        <AccordionSection title="Tendencias de laboratorio" icon="📈" defaultOpen={false}>
          <LabResultTrends patientRegistrationId={patientRegId} />
        </AccordionSection>

        {/* Historial de citas */}
        <AccordionSection title="Historial de citas" icon="📅" defaultOpen={false}>
          <PatientAppointments patientRegistrationId={patientRegId} />
        </AccordionSection>
      </div>
    </div>
  )
}

async function nuevaConsulta(patientRegId: string) {
  "use server"
  const caller = await createServerCaller()
  const enc = await caller.encounter.create({ patientRegistrationId: patientRegId })
  redirect(`/doctor/patients/${patientRegId}/encounters/${enc.id}`)
}

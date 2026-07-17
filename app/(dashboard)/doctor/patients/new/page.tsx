import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PatientForm } from "@/components/patients/patient-form"

export default async function NewPatientPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Registrar Paciente</h1>
      <PatientForm />
    </div>
  )
}

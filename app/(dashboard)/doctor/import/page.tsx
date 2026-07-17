export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PatientImportClient } from "./patient-import-client"

export default async function ImportPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "DOCTOR" && session.user.role !== "SECRETARY") redirect("/doctor")

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Importar Pacientes</h1>
        <p className="mt-1 text-sm text-slate-400">
          Carga masiva de pacientes desde un archivo CSV
        </p>
      </div>
      <PatientImportClient />
    </div>
  )
}

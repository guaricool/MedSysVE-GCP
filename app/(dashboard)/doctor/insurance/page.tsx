export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { InsurancePageClient } from "./insurance-page-client"

export default async function InsurancePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "DOCTOR" && session.user.role !== "SECRETARY") redirect("/doctor")

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Seguros Médicos / HMO</h1>
        <p className="mt-1 text-sm text-slate-400">Gestión de aseguradoras y proveedores de HMO</p>
      </div>
      <InsurancePageClient />
    </div>
  )
}

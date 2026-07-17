export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ConsentTemplatesClient } from "./consent-templates-client"

export default async function ConsentTemplatesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "DOCTOR") redirect("/doctor")

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Consentimientos Informados</h1>
        <p className="mt-1 text-sm text-slate-400">
          Gestión de plantillas de consentimiento para procedimientos
        </p>
      </div>
      <ConsentTemplatesClient />
    </div>
  )
}

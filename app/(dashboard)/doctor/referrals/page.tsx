import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ReferralsClient } from "@/components/referrals/referrals-client"

export default async function ReferralsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/login")

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-white">Referidos recibidos</h1>
        <p className="text-sm text-slate-400">
          Pacientes que otros médicos le han referido.
        </p>
      </div>
      <ReferralsClient />
    </div>
  )
}

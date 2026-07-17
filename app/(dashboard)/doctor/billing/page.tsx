import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { SessionUser } from "@/types"
import { BillingClient } from "@/components/billing/billing-client"

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser
  if (user.role !== "DOCTOR" && user.role !== "SECRETARY") {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Facturación</h1>
      <BillingClient />
    </div>
  )
}

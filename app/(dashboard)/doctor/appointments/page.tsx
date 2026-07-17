import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { SessionUser } from "@/types"
import { AppointmentsLoader } from "@/components/appointments/appointments-loader"

export default async function AppointmentsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser
  if (user.role !== "DOCTOR" && user.role !== "SECRETARY" && user.role !== "ASSISTANT") {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Citas</h1>
      </div>
      <AppointmentsLoader />
    </div>
  )
}

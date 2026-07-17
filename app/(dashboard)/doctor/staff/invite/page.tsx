import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { InviteForm } from "@/components/staff/invite-form"

export default async function InviteStaffPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Agregar Miembro</h1>
      <InviteForm />
    </div>
  )
}

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { SessionUser } from "@/types"
import { StaffManagement } from "@/components/clinic-admin/staff-management"

export default async function ClinicAdminStaffPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const user = session.user as SessionUser
  if (user.role !== "CLINIC_ADMIN") redirect("/login")

  return (
    <div className="max-w-6xl mx-auto py-6">
      <StaffManagement />
    </div>
  )
}

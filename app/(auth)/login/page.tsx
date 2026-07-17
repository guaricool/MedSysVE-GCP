import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { LoginForm } from "@/components/auth/login-form"
import type { SessionUser } from "@/types"

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) {
    const user = session.user as SessionUser
    // Admins go straight to /admin; everyone else lands on /doctor.
    // The Doctor.isAdmin flag is the single source of truth — keep the
    // /admin layout's own email check intact as a defense-in-depth gate.
    if (user.role === "DOCTOR" && user.doctorId) {
      const doc = await db.doctor.findUnique({
        where: { id: user.doctorId },
        select: { isAdmin: true },
      })
      if (doc?.isAdmin) redirect("/admin")
    } else if (user.role === "CLINIC_ADMIN") {
      redirect("/clinica")
    } else if (user.role === "SECRETARY") {
      redirect("/secretary")
    } else if (user.role === "ASSISTANT") {
      redirect("/assistant")
    } else if (user.role === "NURSE") {
      redirect("/doctor/waiting-room")
    }
    redirect("/doctor")
  }
  return <LoginForm />
}

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { SessionUser } from "@/types"
import Link from "next/link"
import { Users, Building, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function ClinicAdminDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const user = session.user as SessionUser
  if (user.role !== "CLINIC_ADMIN") redirect("/login")

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Clínica</h1>
        <p className="text-slate-400 text-sm mt-1">Panel de control administrativo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/clinica/staff" className="block group">
          <Card className="bg-slate-900 border-slate-800 h-full hover:border-amber-500/50 transition-colors">
            <CardHeader>
              <Users className="w-8 h-8 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-white text-lg">Personal de Clínica</CardTitle>
              <CardDescription className="text-slate-400">Administra secretarias, asistentes y enfermeras.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/clinica/doctores" className="block group">
          <Card className="bg-slate-900 border-slate-800 h-full hover:border-amber-500/50 transition-colors">
            <CardHeader>
              <Building className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-white text-lg">Doctores</CardTitle>
              <CardDescription className="text-slate-400">Doctores adscritos y códigos de invitación.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/clinica/audit" className="block group">
          <Card className="bg-slate-900 border-slate-800 h-full hover:border-amber-500/50 transition-colors">
            <CardHeader>
              <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-white text-lg">Auditoría</CardTitle>
              <CardDescription className="text-slate-400">Ver registro de acceso a pacientes por parte del personal.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { SessionUser } from "@/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StaffPinReset } from "@/components/staff/staff-actions"

const rolLabels: Record<string, string> = {
  SECRETARY: "Secretaria",
  ASSISTANT: "Asistente",
  NURSE: "Enfermera",
}

export default async function StaffPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser

  const staff = await db.staff.findMany({
    where: { workspaceId: user.workspaceId, activo: true },
    orderBy: { rol: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mi Equipo</h1>
        <Link href="/doctor/staff/invite">
          <Button>+ Agregar miembro</Button>
        </Link>
      </div>

      {staff.length === 0 ? (
        <p className="text-slate-400">Aún no tienes equipo registrado.</p>
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <div
              key={s.id}
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-white font-medium">
                  {s.nombre} {s.apellido}
                </p>
                <p className="text-slate-400 text-sm">{s.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-slate-300">
                  {rolLabels[s.rol] ?? s.rol}
                </Badge>
                <StaffPinReset staffId={s.id} staffName={`${s.nombre} ${s.apellido}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

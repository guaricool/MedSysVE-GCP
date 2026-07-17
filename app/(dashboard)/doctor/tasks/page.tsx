import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import type { SessionUser } from "@/types"
import { TaskBoard } from "@/components/tasks/task-board"

export default async function TasksPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser
  if (!["DOCTOR", "SECRETARY", "ASSISTANT"].includes(user.role)) redirect("/login")

  const staffList = await db.staff.findMany({
    where: { workspaceId: user.workspaceId, activo: true },
    select: { id: true, nombre: true, apellido: true, rol: true },
    orderBy: { nombre: "asc" },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Tareas del equipo</h1>
        <p className="text-sm text-slate-400">
          Gestiona y asigna tareas al personal del consultorio
        </p>
      </div>
      <TaskBoard staffList={staffList} />
    </div>
  )
}

export const dynamic = "force-dynamic"

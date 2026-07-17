import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { SessionUser } from "@/types"
import { WaitingRoomClient } from "@/components/waiting-room/waiting-room-client"

export default async function WaitingRoomPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser

  const allowed: string[] = ["DOCTOR", "SECRETARY", "ASSISTANT", "NURSE"]
  if (!allowed.includes(user.role)) redirect("/login")

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Sala de Espera</h1>
        <p className="text-sm text-slate-400">
          {new Date().toLocaleDateString("es-VE", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: 'America/Caracas' })}
        </p>
      </div>
      <WaitingRoomClient role={user.role} />
    </div>
  )
}

export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { MensajesClient } from "@/components/mensajes/mensajes-client"
import type { SessionUser } from "@/types"

export const dynamic = "force-dynamic"

export default async function MensajesPage() {
  const session = await auth()
  const user = session?.user as SessionUser | undefined
  if (!user || user.role !== "DOCTOR") redirect("/login")

  const registrations = await db.patientRegistration.findMany({
    where: { workspaceId: user.workspaceId },
    include: {
      patient: { select: { nombre: true, apellido: true } },
      mensajes: {
        orderBy: { creadoAt: "desc" },
        take: 1,
        select: { texto: true, creadoAt: true, autor: true, leido: true },
      },
      _count: { select: { mensajes: { where: { autor: "PATIENT", leido: false } } } },
    },
    orderBy: { updatedAt: "desc" },
  })

  const conversations = registrations
    .filter((r) => r.mensajes.length > 0 || r._count.mensajes > 0)
    .map((r) => ({
      patientRegistrationId: r.id,
      patientName: `${r.patient.nombre} ${r.patient.apellido}`,
      lastMessage: r.mensajes[0]
        ? { texto: r.mensajes[0].texto, creadoAt: r.mensajes[0].creadoAt.toISOString(), autor: r.mensajes[0].autor }
        : null,
      unread: r._count.mensajes,
    }))

  return <MensajesClient initialConversations={conversations} />
}

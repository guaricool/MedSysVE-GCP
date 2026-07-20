import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PortalPerfilClient } from "@/components/portal/portal-perfil-client"

export const dynamic = "force-dynamic"

export default async function PortalPerfilPage() {
  const session = await auth()
  const patientId = (session?.user as { patientId?: string } | undefined)?.patientId
  if (!patientId) redirect("/portal/login")

  let patient = await db.patient.findUnique({
    where: { id: patientId },
    select: { nombre: true, apellido: true, telefono: true, email: true, numeroIdentificacion: true },
  })
  
  if (!patient) {
    const portalUser = await db.portalUser.findUnique({
      where: { id: patientId },
      include: { patientProfile: true },
    })
    if (portalUser) {
      patient = {
        nombre: portalUser.patientProfile?.nombre ?? "",
        apellido: portalUser.patientProfile?.apellido ?? "",
        telefono: portalUser.telefono,
        email: portalUser.email,
        numeroIdentificacion: portalUser.patientProfile?.numeroIdentificacion ?? null,
      }
    }
  }
  
  if (!patient) redirect("/portal/login")

  return (
    <div className="py-4">
      <PortalPerfilClient initialData={patient} />
    </div>
  )
}

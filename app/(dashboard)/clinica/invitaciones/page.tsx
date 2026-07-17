import { Metadata } from "next"
import { InvitationCodes } from "@/components/clinic-admin/invitation-codes"

export const metadata: Metadata = {
  title: "Códigos de Invitación | MedSysVE",
  description: "Gestiona los códigos de invitación para los médicos de la clínica.",
}

export default function ClinicInvitationsPage() {
  return (
    <div className="p-6">
      <InvitationCodes />
    </div>
  )
}

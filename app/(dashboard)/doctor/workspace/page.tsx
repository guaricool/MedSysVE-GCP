import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createServerCaller } from "@/server/caller"
import { WorkspaceSettingsClient } from "@/components/workspace/workspace-settings-client"
import { ClinicPostsManager } from "@/components/clinic/clinic-posts-manager"
import { ReminderConfigClient } from "@/components/workspace/reminder-config-client"
import { ClinicWorkflowSettings } from "@/components/workspace/clinic-workflow-settings"
import { BrandingUpload } from "@/components/workspace/branding-upload"
import { SelloUpload } from "@/components/workspace/sello-upload"
import type { SessionUser } from "@/types"

export default async function WorkspacePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/login")
  const user = session.user as SessionUser

  const caller = await createServerCaller()
  const ws = await caller.workspace.current()
  if (!ws) redirect("/login")

  const workspace = await db.workspace.findUnique({
    where: { id: user.workspaceId },
    select: {
      clinicId: true,
      recordatorioHoras: true,
      recordatorioWa: true,
      recordatorioEmail: true,
      logoUrl: true,
      membreteUrl: true,
      autoCreateHistoryOnEncounter: true,
      emailAppointmentReminders: true,
      allowedIps: true,
      doctor: {
        select: {
          selloUrl: true
        }
      }
    },
  })

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-white">Configuración del consultorio</h1>
        <p className="text-sm text-slate-400">
          Información que aparece en documentos, recetas y facturas.
        </p>
        <WorkspaceSettingsClient
          workspace={{
            id: ws.id,
            nombre: ws.nombre,
            direccion: ws.direccion,
            telefono: ws.telefono,
            rif: ws.rif,
            razonSocial: ws.razonSocial,
            direccionFiscal: ws.direccionFiscal,
            logoUrl: ws.logoUrl,
            estado: ws.estado,
            ciudad: ws.ciudad,
            doctorId: user.doctorId,
            clinic: ws.clinic
              ? {
                  id: ws.clinic.id,
                  nombre: ws.clinic.nombre,
                  estado: ws.clinic.estado,
                  ciudad: ws.clinic.ciudad,
                  invitationCodes: ws.clinic.invitationCodes,
                }
              : null,
          }}
        />
      </div>

      <div className="border-t border-slate-800 pt-6">
        <ClinicWorkflowSettings
          initialAutoCreate={workspace?.autoCreateHistoryOnEncounter ?? false}
          initialEmailReminders={workspace?.emailAppointmentReminders ?? true}
          initialAllowedIps={workspace?.allowedIps ?? null}
        />
      </div>

      <div className="border-t border-slate-800 pt-6">
        <BrandingUpload
          initialLogoUrl={workspace?.logoUrl ?? null}
          initialMembreteUrl={workspace?.membreteUrl ?? null}
        />
      </div>

      <div className="border-t border-slate-800 pt-6">
        <SelloUpload initialSelloUrl={workspace?.doctor?.selloUrl ?? null} />
      </div>

      <div className="border-t border-slate-800 pt-6">
        <ReminderConfigClient
          initialHoras={workspace?.recordatorioHoras ?? 24}
          initialWa={workspace?.recordatorioWa ?? false}
          initialEmail={workspace?.recordatorioEmail ?? true}
        />
      </div>

      {workspace?.clinicId && (
        <div className="border-t border-slate-800 pt-6">
          <ClinicPostsManager clinicId={workspace.clinicId} />
        </div>
      )}
    </div>
  )
}

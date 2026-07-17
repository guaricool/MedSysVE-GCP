
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { createServerCaller } from "@/server/caller"
import { PortalAnnouncements } from "@/components/portal/portal-announcements"
import { PortalDashboardClient } from "@/components/portal/portal-dashboard-client"

export const dynamic = "force-dynamic"

export default async function PortalHome() {
  const session = await auth()
  if (session?.user?.role !== "PATIENT") redirect("/portal/login")

  const caller = await createServerCaller()
  const [
    workspaces,
    docs,
    encounters,
    appointments,
    vaccines,
    imagingOrders,
    labOrders,
    labResults,
    prescriptions,
  ] = await Promise.all([
    caller.portal.myWorkspaces(),
    caller.portal.myDocuments(),
    caller.portal.myEncounters(),
    caller.portal.myAppointments(),
    (caller.portal as any).myVaccines(),
    (caller.portal as any).myImagingOrders(),
    (caller.portal as any).myLabOrders(),
    caller.portal.myLabResults(),
    (caller.portal as any).myPrescriptions(),
  ])

  return (
    <div className="space-y-6">
      <PortalAnnouncements />
      <PortalDashboardClient
        workspaces={workspaces}
        docs={docs}
        encounters={encounters}
        appointments={appointments}
        vaccines={vaccines}
        imagingOrders={imagingOrders}
        labOrders={labOrders}
        labResults={labResults}
        prescriptions={prescriptions}
      />
    </div>
  )
}


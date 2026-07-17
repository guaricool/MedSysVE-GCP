import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ComplianceClient } from "./compliance-client"

export const metadata = {
  title: "Cumplimiento LOPDP — MedSysVE",
  description: "Solicitudes de exportación y eliminación de datos personales conforme a la LOPDP de Venezuela.",
}

export default async function DoctorCompliancePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "DOCTOR") redirect("/doctor")

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <header>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-2">
              Tus derechos LOPDP
            </p>
            <h1 className="text-2xl font-bold text-white">Cumplimiento y Datos Personales</h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP) de
              Venezuela, puedes solicitar una copia de los datos personales que
              tratamos sobre ti o sobre tus pacientes, así como ejercer tu derecho
              de cancelación. Las solicitudes quedan registradas con fines de
              auditoría.
            </p>
          </div>
          <Link
            href="/legal/privacidad"
            className="text-xs text-amber-400 hover:underline"
            target="_blank"
          >
            Leer Política de Privacidad →
          </Link>
        </div>
      </header>

      <ComplianceClient />

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2 text-xs text-slate-400">
        <p className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
          Información importante
        </p>
        <ul className="list-disc list-outside ml-5 space-y-1">
          <li>
            Las solicitudes de exportación se atienden en un plazo máximo de 15
            días hábiles (LOPDP Art. 62).
          </li>
          <li>
            Las solicitudes de eliminación (cancelación) NO destruyen el historial
            clínico — los registros se anonimizan de forma irreversible para
            preservar la trazabilidad de auditoría (LOPDP Art. 61 + obligación
            legal de conservar historias clínicas mínimo 5 años).
          </li>
          <li>
            Yoguitech.LLC, como encargado del tratamiento, ejecuta la cancelación
            previa aprobación de un administrador del sistema.
          </li>
          <li>
            Toda solicitud queda registrada con timestamp, IP truncada y agente de
            navegador.
          </li>
        </ul>
      </section>
    </div>
  )
}
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminMensajesClient from "@/components/admin/admin-mensajes-client"

const ADMIN_EMAIL = "cpierluissis@gmail.com"

export const metadata = {
  title: "Mensajes WhatsApp | Admin MedSysVE",
}

export default async function AdminMensajesPage() {
  const session = await auth()

  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    redirect("/doctor")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bandeja de Entrada WhatsApp</h1>
          <p className="text-slate-400 text-sm">
            Mensajes recibidos en el número de Marketing / Soporte.
          </p>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden h-[700px]">
        <AdminMensajesClient />
      </div>
    </div>
  )
}

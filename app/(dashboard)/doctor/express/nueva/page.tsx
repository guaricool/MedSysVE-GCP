import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ExpressOrderForm } from "@/components/express/express-order-form"

export default async function NuevaExpressOrderPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/login")

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/doctor/express"
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Órdenes Express
        </Link>
      </div>
      <div>
        <h1 className="text-lg font-semibold text-white">Nueva Orden Express</h1>
        <p className="text-sm text-slate-400">
          Genera una receta u orden médica para un paciente no registrado. El PDF se abrirá
          automáticamente al guardar.
        </p>
      </div>
      <ExpressOrderForm />
    </div>
  )
}

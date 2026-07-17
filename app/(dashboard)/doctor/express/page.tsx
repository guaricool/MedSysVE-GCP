import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ExpressOrderList } from "@/components/express/express-order-list"

export default async function ExpressOrderPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/login")

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Órdenes Express</h1>
          <p className="text-sm text-slate-400">
            Recetas, órdenes de laboratorio e imagenología sin registrar paciente.
          </p>
        </div>
        <Link
          href="/doctor/express/nueva"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} />
          Nueva Orden Express
        </Link>
      </div>
      <ExpressOrderList />
    </div>
  )
}

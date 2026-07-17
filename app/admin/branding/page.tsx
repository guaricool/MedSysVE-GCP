import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

const ADMIN_EMAIL = "cpierluissis@gmail.com"

export default async function AdminBrandingPage() {
  const session = await auth()
  if (!session?.user || session.user.email !== ADMIN_EMAIL) redirect("/doctor")

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-white mb-1">Branding de la Plataforma</h2>
        <p className="text-slate-400 text-sm">
          Identidad corporativa y datos del operador visibles para todos los usuarios.
        </p>
      </header>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <Row label="Operador" value="Yoguitech.LLC" />
        <Row label="Tagline" value="Sistema de Gestión Médica para Venezuela" />
        <Row label="Correo único de contacto" value="yoguitech@gmail.com" mono />
        <Row label="Aviso legal en footer" value="© 2026 Yoguitech.LLC — Todos los derechos reservados." />
        <Row
          label="Color primario"
          value="#f59e0b (amber-500)"
          mono
          swatch="#f59e0b"
        />
        <Row
          label="Color acento"
          value="#0ea5e9 (sky-500)"
          mono
          swatch="#0ea5e9"
        />
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-200">
        <p className="font-semibold uppercase tracking-wider text-xs text-amber-400 mb-2">
          Aviso
        </p>
        <p className="leading-relaxed">
          Estos valores son provistos por Yoguitech.LLC y se muestran en el login,
          el dashboard, el pie de página y los documentos generados por la
          plataforma. Para modificarlos edita{" "}
          <code className="text-amber-300 font-mono text-xs">app/(auth)/layout.tsx</code>{" "}
          y{" "}
          <code className="text-amber-300 font-mono text-xs">app/(dashboard)/layout.tsx</code>
          , o crea un modelo <code className="text-amber-300 font-mono text-xs">PlatformConfig</code>{" "}
          y vincúlalo aquí.
        </p>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  swatch,
}: {
  label: string
  value: string
  mono?: boolean
  swatch?: string
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-slate-800/50 last:border-0">
      <p className="text-slate-400 text-xs uppercase tracking-wider">{label}</p>
      <div className="md:col-span-2 flex items-center gap-3">
        {swatch && (
          <span
            aria-hidden
            className="inline-block w-5 h-5 rounded border border-slate-700"
            style={{ backgroundColor: swatch }}
          />
        )}
        <p className={`text-white ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
      </div>
    </div>
  )
}
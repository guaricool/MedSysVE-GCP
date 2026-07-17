import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

const ADMIN_EMAIL = "cpierluissis@gmail.com"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.email !== ADMIN_EMAIL) redirect("/doctor")
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/admin" className="flex items-center gap-3 group">
            {/* next/image + priority suppresses the auto-generated
                `<link rel="preload" as="image">` that was firing the
                "preloaded but not used within a few seconds" warning. */}
            <Image
              src="/logo-medsysve-mark.png"
              alt="MedSysVE"
              width={40}
              height={40}
              priority
              className="drop-shadow-[0_0_12px_rgba(245,158,11,0.15)] group-hover:drop-shadow-[0_0_18px_rgba(245,158,11,0.3)] transition-all"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">
                <span className="text-[#FFD100]">Med</span>
                <span className="text-[#3B82F6]">Sys</span>
                <span className="text-[#EF4444]">VE</span>
              </span>
              <span className="text-[10px] text-amber-400 uppercase tracking-widest">Panel Admin · Yoguitech.LLC</span>
            </div>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/30">
            Super Admin
          </span>
          <nav className="ml-auto flex gap-4 text-sm flex-wrap">
            <Link href="/admin" className="text-slate-300 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/admin/doctors" className="text-slate-300 hover:text-white transition-colors">Doctores</Link>
            <Link href="/admin/compliance" className="text-slate-300 hover:text-white transition-colors">Cumplimiento</Link>
            <Link href="/admin/branding" className="text-slate-300 hover:text-white transition-colors">Branding</Link>
            <Link href="/doctor" className="text-slate-400 hover:text-white transition-colors">← Volver al sistema</Link>
          </nav>
        </div>
      </header>
      <main className="p-6 pb-24">{children}</main>
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-[11px] text-slate-500 flex flex-wrap justify-between gap-2">
          <p>
            MedSysVE Admin Console · Operado por{" "}
            <span className="text-amber-400 font-semibold">Yoguitech.LLC</span>
          </p>
          <p className="space-x-2">
            <Link href="/legal/privacidad" className="hover:text-amber-400">Privacidad</Link>
            <span className="text-slate-700">·</span>
            <a href="mailto:yoguitech@gmail.com" className="hover:text-amber-400">yoguitech@gmail.com</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
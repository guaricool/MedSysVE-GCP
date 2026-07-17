import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "Documentos Legales — MedSysVE",
  description: "Términos y Condiciones, Política de Privacidad y Consentimiento Informado de MedSysVE, operado por Yoguitech.LLC.",
}

const links = [
  { href: "/legal/terminos", label: "Términos y Condiciones" },
  { href: "/legal/privacidad", label: "Política de Privacidad" },
  { href: "/legal/cookies", label: "Política de Cookies" },
  { href: "/legal/lopdp-consentimiento", label: "Consentimiento Informado (LOPDP)" },
]

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            {/* next/image + priority suppresses the auto-generated
                `<link rel="preload" as="image">` that was firing the
                "preloaded but not used within a few seconds" warning. */}
            <Image
              src="/logo-medsysve-mark.png"
              alt="MedSysVE"
              width={40}
              height={40}
              priority
              className="drop-shadow-[0_0_12px_rgba(245,158,11,0.12)] group-hover:drop-shadow-[0_0_16px_rgba(245,158,11,0.25)] transition-all"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">
                <span className="text-[#FFD100]">Med</span>
                <span className="text-[#3B82F6]">Sys</span>
                <span className="text-[#EF4444]">VE</span>
              </span>
              <span className="text-xs text-slate-400">por Yoguitech.LLC</span>
            </div>
          </Link>
          <nav className="ml-auto flex flex-wrap gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10 pb-24">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-2">
            Marco Legal — Venezuela
          </p>
          <p className="text-xs text-slate-500">
            Documentos redactados conforme a la Ley Orgánica de Protección de Datos
            Personales (LOPDP, 2022) y demás normativa sanitaria venezolana.
            Constituyen borradores sujetos a revisión por abogado.
          </p>
        </div>
        {children}
      </main>
      <footer className="border-t border-slate-800 bg-slate-900/40 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6 text-xs text-slate-500 flex flex-wrap gap-4 justify-between">
          <p>© {new Date().getFullYear()} Yoguitech.LLC. Todos los derechos reservados.</p>
          <p>
            Operador:{" "}
            <a href="mailto:yoguitech@gmail.com" className="text-amber-400 hover:underline">
              yoguitech@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
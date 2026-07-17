import Link from "next/link"
import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3 group mb-4">
            {/* next/image + priority suppresses the auto-generated
                `<link rel="preload" as="image">` that was firing the
                "preloaded but not used within a few seconds" warning. */}
            <Image
              src="/logo-medsysve-mark.png"
              alt="MedSysVE"
              width={72}
              height={72}
              priority
              className="drop-shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:drop-shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all"
            />
            <h1 className="text-3xl font-black leading-tight mt-1 tracking-tight">
              <span className="text-[#FFD100]">Med</span>
              <span className="text-[#3B82F6]">Sys</span>
              <span className="text-[#EF4444]">VE</span>
            </h1>
            <p className="text-xs text-slate-400 -mt-2">Sistema de Gestión Médica</p>
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-3">
            operado por <span className="text-amber-400">Yoguitech.LLC</span>
          </p>
        </div>
        {children}
        <footer className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <p>
            Al continuar aceptas nuestros{" "}
            <Link href="/legal/terminos" className="text-amber-400 hover:underline">
              Términos
            </Link>
            {", "}
            <Link href="/legal/privacidad" className="text-amber-400 hover:underline">
              Política de Privacidad
            </Link>
            {" y "}
            <Link href="/legal/cookies" className="text-amber-400 hover:underline">
              Cookies
            </Link>
            .
          </p>
          <p className="text-slate-600">
            © {new Date().getFullYear()} Yoguitech.LLC
          </p>
        </footer>
      </div>
    </div>
  )
}
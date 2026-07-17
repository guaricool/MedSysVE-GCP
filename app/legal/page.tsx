import Link from "next/link"

const CARDS = [
  {
    href: "/legal/terminos",
    title: "Términos y Condiciones",
    desc: "Las reglas que rigen el uso de la plataforma, los derechos y obligaciones del profesional de la salud y del operador.",
    badge: "Obligatorio aceptar",
    tone: "amber",
  },
  {
    href: "/legal/privacidad",
    title: "Política de Privacidad",
    desc: "Cómo recopilamos, usamos, almacenamos y protegemos los datos personales y clínicos conforme a la LOPDP.",
    badge: "Obligatorio aceptar",
    tone: "amber",
  },
  {
    href: "/legal/cookies",
    title: "Política de Cookies",
    desc: "Detalle de las cookies técnicas, funcionales y analíticas utilizadas por la plataforma.",
    badge: "Opcional aceptar",
    tone: "sky",
  },
  {
    href: "/legal/lopdp-consentimiento",
    title: "Consentimiento Informado (LOPDP)",
    desc: "El consentimiento expreso exigido por el artículo 25 de la Ley Orgánica de Protección de Datos Personales.",
    badge: "Obligatorio firmar",
    tone: "amber",
  },
]

const TONE = {
  amber: "border-amber-500/30 bg-amber-500/5 text-amber-300",
  sky: "border-sky-500/30 bg-sky-500/5 text-sky-300",
}

export default function LegalIndexPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-2">
          Documentos legales vigentes
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">Marco Legal de MedSysVE</h1>
        <p className="text-slate-300 leading-relaxed">
          MedSysVE es operado por <strong className="text-white">Yoguitech.LLC</strong>{" "}
          y presta servicios a profesionales de la salud en la República Bolivariana
          de Venezuela. Los siguientes documentos rigen la relación entre la plataforma,
          los profesionales que la utilizan y los pacientes cuyos datos son tratados.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-amber-500/40 transition-all p-5 group"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="text-lg font-semibold text-white group-hover:text-amber-300 transition-colors">
                {c.title}
              </h2>
              <span
                className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${TONE[c.tone as keyof typeof TONE]}`}
              >
                {c.badge}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{c.desc}</p>
            <p className="mt-3 text-xs text-amber-400 group-hover:translate-x-0.5 transition-transform">
              Leer documento →
            </p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300 leading-relaxed space-y-3">
        <p>
          <strong className="text-white">Aviso importante:</strong> Los textos publicados
          en esta sección constituyen <strong className="text-amber-300">borradores genéricos</strong>{" "}
          elaborados por el equipo técnico de MedSysVE. <strong className="text-amber-300">No constituyen asesoría legal</strong>{" "}
          y deben ser revisados y aprobados por un abogado venezolano especializado
          en derecho digital y sanitario antes de su entrada en vigencia definitiva.
        </p>
        <p>
          Si usted requiere una versión legalmente vinculante, consulte directamente
          con un profesional del derecho. Para preguntas sobre la operación de la
          plataforma o para reportar un asunto de privacidad, contacte a{" "}
          <a className="text-amber-400 underline" href="mailto:yoguitech@gmail.com">
            yoguitech@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  )
}
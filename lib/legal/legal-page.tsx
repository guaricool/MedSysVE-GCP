import { readFile } from "fs/promises"
import { join } from "path"
import { Markdown } from "./markdown"

interface LegalPageProps {
  slug: "terminos" | "privacidad" | "cookies" | "lopdp-consentimiento"
}

const FILE_MAP: Record<LegalPageProps["slug"], string> = {
  "terminos": "terminos.md",
  "privacidad": "privacidad.md",
  "cookies": "cookies.md",
  "lopdp-consentimiento": "lopdp-consentimiento.md",
}

export async function LegalPage({ slug }: LegalPageProps) {
  const path = join(process.cwd(), "content", "legal", FILE_MAP[slug])
  let source: string
  try {
    source = await readFile(path, "utf8")
  } catch {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-6 text-red-200">
        <p className="font-semibold">Documento no encontrado</p>
        <p className="text-sm text-red-300/80 mt-1">
          No se pudo cargar el archivo <code>{FILE_MAP[slug]}</code> desde <code>content/legal/</code>.
        </p>
      </div>
    )
  }

  return <Markdown source={source} />
}
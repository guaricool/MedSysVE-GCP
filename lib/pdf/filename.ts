const VE_TZ = "America/Caracas"

function sanitizeName(s: string): string {
  // Decompose accented chars, then strip combining diacritics (U+0300–U+036F)
  return s
    .normalize("NFD")
    .split("")
    .filter((c) => c.charCodeAt(0) < 0x0300 || c.charCodeAt(0) > 0x036f)
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "")
}

export function pdfFilename(tipo: string, nombre: string, apellido: string, fecha: Date): string {
  const name = sanitizeName(`${nombre}${apellido}`)

  const fmt = new Intl.DateTimeFormat("es-VE", {
    timeZone: VE_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const parts = fmt.formatToParts(fecha)
  const dd = parts.find((p) => p.type === "day")?.value ?? "01"
  const mm = parts.find((p) => p.type === "month")?.value ?? "01"
  const yyyy = parts.find((p) => p.type === "year")?.value ?? "2026"

  return `${tipo}-${name}-${dd}${mm}${yyyy}.pdf`
}

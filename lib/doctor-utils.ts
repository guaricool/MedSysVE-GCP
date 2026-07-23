export interface DoctorNameInput {
  prefijo?: string | null
  nombre?: string | null
  apellido?: string | null
  [key: string]: any
}

const COMMON_FEMALE_FIRST_NAMES = new Set([
  "dayana", "sivana", "maria", "maría", "ana", "patricia", "daniela", "gabriela", "andrea",
  "carmen", "luisa", "elena", "sofia", "sofía", "isabel", "camila", "lucia", "lucía", "laura",
  "rosa", "claudia", "veronica", "verónica", "monica", "mónica", "vanessa", "carolina", "adriana",
  "paola", "stephanie", "valentina", "victoria", "mariana", "natalia", "barbara", "bárbaro", "silvia",
  "diana", "alessandra", "beatriz", "gloria", "yolanda", "margarita", "teresa", "alicia", "inés", "ines",
  "rocio", "rociol", "rocío", "lorena", "monserrat", "ximena", "jimena", "genesis", "génesis", "isabella",
  "nicole", "yamileth", "yusmely", "yusmeli", "carmen", "coromoto", "milagros", "nayarith", "xiomara"
])

/**
 * Returns "Dr." or "Dra." based on explicit prefijo or smart female name detection.
 */
export function getDoctorPrefix(doctor?: DoctorNameInput | null): "Dr." | "Dra." {
  if (!doctor) return "Dr."
  if (doctor.prefijo === "Dra." || doctor.prefijo === "Dr.") {
    return doctor.prefijo
  }
  
  // Smart fallback: check if first name is a recognized female first name or ends in common female patterns
  const first = (doctor.nombre || "").trim().split(/\s+/)[0]?.toLowerCase() || ""
  if (COMMON_FEMALE_FIRST_NAMES.has(first)) {
    return "Dra."
  }

  return "Dr."
}

/**
 * Formats full doctor title and name, e.g., "Dra. Dayana Pérez" or "Dr. Carlos Pierluissi".
 */
export function formatDoctorName(doctor?: DoctorNameInput | null): string {
  if (!doctor) return ""
  const prefix = getDoctorPrefix(doctor)
  const nameParts = [doctor.nombre, doctor.apellido].filter(Boolean).join(" ").trim()
  if (!nameParts) return prefix
  return `${prefix} ${nameParts}`
}

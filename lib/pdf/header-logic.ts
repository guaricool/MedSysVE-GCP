import { join, resolve } from "path"
import { existsSync } from "fs"

export interface DoctorInfo {
  nombre: string
  segundoNombre?: string
  segundoApellido?: string
  especialidad?: string
  cedula?: string
  mppsMatricula?: string
  rif?: string
  email?: string
  telefono?: string
  /// Absolute fs path (already resolved via urlToFsPath) or undefined.
  fotoPath?: string
  subEspecialidades?: string[]
}

export interface ClinicInfo {
  nombre: string
  direccion?: string
  telefono?: string
  email?: string
  rif?: string
  /// Absolute fs path or undefined.
  logoPath?: string
}

export interface WorkspaceInfo {
  nombre?: string
  /// Absolute fs path or undefined. Membrete = full letterhead background.
  logoPath?: string
  membretePath?: string
}

export interface PdfBranding {
  /// Resolved absolute fs path of the doctor photo.
  doctorFoto?: string
  /// Resolved absolute fs path of the clinic logo (or workspace logo if no clinic).
  clinicLogo?: string
  /// Resolved absolute fs path of the membrete (full-page letterhead background).
  membrete?: string
  /// Resolved absolute fs path of the doctor's sello.
  selloPath?: string
  /// Legacy field — kept so existing PDF generators (which read
  /// `branding.logoPath`) continue to work. Points at the clinic logo (or
  /// workspace logo if no clinic).
  logoPath?: string
}

export interface PdfHeader {
  modo: "clinic" | "doctor"
  titulo: string
  subtitulo: string
  lineas: string[]
  subEspecialidades?: string[]
}

export function buildPdfHeader(doctor: DoctorInfo, clinic?: ClinicInfo | null): PdfHeader {
  const mappedEspecialidad = (doctor.especialidad === "Traumatología" || doctor.especialidad === "Ortopedia") ? "Traumatología y ortopedia" : doctor.especialidad
  const mappedSub = (doctor.subEspecialidades ?? []).map(s => (s === "Traumatología" || s === "Ortopedia") ? "Traumatología y ortopedia" : s)

  if (clinic) {
    return {
      modo: "clinic",
      titulo: clinic.nombre,
      subtitulo: `${doctor.nombre}${mappedEspecialidad ? " — " + mappedEspecialidad : ""}`,
      lineas: [
        clinic.direccion ?? "",
        clinic.telefono ? `Tel: ${clinic.telefono}` : "",
        doctor.cedula ? `C.I.: ${doctor.cedula}` : "",
      ].filter(Boolean),
      subEspecialidades: mappedSub,
    }
  }
  return {
    modo: "doctor",
    titulo: doctor.nombre,
    subtitulo: mappedEspecialidad ?? "",
    lineas: [doctor.cedula ? `C.I.: ${doctor.cedula}` : ""].filter(Boolean),
    subEspecialidades: mappedSub,
  }
}

export function buildFooterLines(doctor: DoctorInfo, clinic?: ClinicInfo | null): string[] {
  const lines: string[] = []
  const docLine = [doctor.nombre, doctor.especialidad].filter(Boolean).join("  •  ")
  if (doctor.cedula) lines.push(`${docLine}  •  C.I.: ${doctor.cedula}`)
  else lines.push(docLine)

  const contactParts = [doctor.telefono, doctor.email].filter(Boolean)
  if (contactParts.length) lines.push(contactParts.join("  |  "))

  if (clinic) {
    const clinicParts = [clinic.nombre, clinic.direccion].filter(Boolean)
    if (clinicParts.length) lines.push(clinicParts.join("  •  "))
    const clinicContact = [clinic.telefono, clinic.email].filter(Boolean)
    if (clinicContact.length) lines.push(clinicContact.join("  |  "))
  }

  // Always credit the operator at the very bottom — required for LOPDP/HIPAA traceability.
  lines.push(`Generado por MedSysVE — Yoguitech.LLC`)

  return lines
}

/**
 * Resolve a URL to an absolute filesystem path on disk.
 *
 * Supports both shapes:
 *   - Legacy:  `/uploads/logos/X.png` → `<cwd>/public/uploads/logos/X.png`
 *   - Current: `/api/uploads/logos/X.png` → `<UPLOADS_DIR>/logos/X.png`
 *
 * UPLOADS_DIR is the persistent volume mount point in production
 * (Coolify volume mount). Falls back to `<cwd>/public/uploads` for dev.
 *
 * Returns undefined if the file doesn't exist on disk so @react-pdf/renderer
 * doesn't crash on missing assets.
 */
export function urlToFsPath(url: string | null | undefined): string | undefined {
  if (!url) return undefined

  let p: string
  if (url.startsWith("/api/uploads/")) {
    // /api/uploads/logos/X.png → <UPLOADS_DIR>/logos/X.png
    const uploadsRoot = process.env.UPLOADS_DIR?.trim() || resolve(process.cwd(), "public", "uploads")
    const relative = url.slice("/api/uploads/".length)
    p = join(uploadsRoot, relative)
  } else if (url.startsWith("/uploads/")) {
    // Legacy: <cwd>/public/uploads/logos/X.png
    p = join(process.cwd(), "public", url)
  } else {
    return undefined
  }
  if (!existsSync(p)) return undefined
  return p
}

/**
 * Build a complete PdfBranding object from raw Doctor, Clinic and Workspace
 * records. Pass the doctor.clinic workspace (or null). Returns only the
 * assets that actually exist on disk so the PDF renderer can use them safely.
 */
export function buildPdfBranding(opts: {
  doctor?: { fotoUrl?: string | null; selloUrl?: string | null } | null
  clinic?: { logoUrl?: string | null } | null
  workspace?: { logoUrl?: string | null; membreteUrl?: string | null } | null
}): PdfBranding {
  const doctorFoto = urlToFsPath(opts.doctor?.fotoUrl ?? undefined)
  const selloPath = urlToFsPath(opts.doctor?.selloUrl ?? undefined)
  const clinicLogo = urlToFsPath(opts.clinic?.logoUrl ?? opts.workspace?.logoUrl ?? undefined)
  const membrete = urlToFsPath(opts.workspace?.membreteUrl ?? undefined)
  return {
    doctorFoto,
    clinicLogo,
    membrete,
    selloPath,
    // Legacy alias so existing PDF generators continue to read the right path.
    logoPath: clinicLogo,
  }
}
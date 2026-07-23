import { View, Text, Image } from "@react-pdf/renderer"
import type { Style } from "@react-pdf/types"

interface SelloFirmaProps {
  selloPath?: string
  /**
   * Sello image dimensions in pt. The sello sits *on top of* the
   * signature space (typical medical practice — doctor signs, then
   * stamps), so it is layered above the space in
   * DOM order.
   */
  selloSize?: number
  style?: Style
}

/**
 * Sello + signature line used in the footer of every PDF generator
 * (receta, orden de lab, orden de imagen, informe, etc.).
 *
 * The previous inline implementation in each generator used
 * `position: absolute, bottom: -8` on the sello <Image> with NO
 * fixed height on the wrapper <View>. The wrapper therefore collapsed
 * to the height of the signature text (~9pt), the sello's
 * `bottom: -8` extended it 80pt upward, and the bottom edge of the
 * sello ended up 70+pt above the wrapper's top — which crossed
 * the footer's `borderTop` line and covered the data the doctor
 * had just rendered.
 *
 * The fix: the wrapper has an explicit `height` large enough to
 * contain the sello, the sello is anchored to the top of the
 * wrapper (`top: 0`), and the signature line is anchored to the
 * bottom. This way the sello always lives *inside* the wrapper
 * and never crosses the closing line.
 *
 * Order in the printed page (top → bottom):
 *   [sello image]            ← anchored top: 0
 *   ____________             ← signature line, anchored bottom: 8
 *   ─────────────────────   ← closing line, added by the parent
 *                              (e.g. via styles.datosBox.borderTop)
 *   doctor data / disclaimer
 */
export function SelloFirma({
  selloPath,
  selloSize = 70,
  style,
}: SelloFirmaProps) {
  return (
    <View
      style={{
        position: "relative",
        alignSelf: "flex-end",
        alignItems: "center",
        height: selloSize,
        marginBottom: 4,
        ...style,
      }}
    >
      {/* Sello: anchored to the top of the box. Renders AFTER the
          signature line in the DOM, so in react-pdf (no real z-index)
          the sello paints on top of the line — exactly what you want
          for a real "firma y sello" effect. */}
      {selloPath && (
        <Image
          src={selloPath}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: selloSize,
            height: selloSize,
            objectFit: "contain",
            opacity: 0.85,
          }}
        />
      )}
    </View>
  )
}

interface FirmaBloqueProps {
  doctor: { nombre: string; apellido?: string; especialidad?: string; cedula?: string; telefono?: string; email?: string }
  clinic?: { nombre?: string; direccionFiscal?: string; telefono?: string; email?: string } | null
  branding?: { selloPath?: string }
  /**
   * Render the sello + signature line. When `false` (patient-portal
   * preview), the parent must add a "VISTA PREVIA" watermark.
   */
  omitSello?: boolean
  /**
   * Disclaimer line at the very bottom of the block. Default:
   * "Válido solo con firma y sello del médico".
   */
  disclaimer?: string
}

/**
 * Reusable firma-y-sello block:
 *
 *   [sello]                       ← only if !omitSello && branding?.selloPath
 *   ____________                  ← signature line (only if !omitSello)
 *   ─────────────────────────    ← closing separator
 *   Dr. Nombre Apellido
 *   Especialidad · C.I. 12345
 *   0414... | doctor@example.com
 *   Válido solo con firma y sello del médico
 *
 * The closing line lives on the box that wraps the doctor data, not
 * on the outer footer — so the sello sits above the line, never
 * crossing it. The previous design (borderTop on the outer footer)
 * put the line ABOVE the sello, which is the wrong visual order.
 */
export function FirmaBloque({ doctor, clinic, branding, omitSello, disclaimer }: FirmaBloqueProps) {
  const footerLines = buildFooterLinesLocal(doctor, clinic)
  const disc = disclaimer ?? "Válido solo con firma y sello del médico"
  return (
    <View>
      {!omitSello && <SelloFirma selloPath={branding?.selloPath} />}
      <View
        style={{
          paddingTop: 6,
          marginTop: 4,
        }}
      >
        {/* Closing separator. Implemented as a filled View of fixed
            height rather than `borderTop` because react-pdf renders
            the latter as broken segments when the parent's flex
            layout has variable baseline alignment on the row above
            (the sello Image). A solid 1pt block reads as a
            continuous horizontal line. */}
        <View
          style={{
            height: 1,
            backgroundColor: "#333",
            marginBottom: 4,
          }}
        />
        {footerLines.map((line, i) => (
          <Text key={i} style={{ fontSize: 8, color: "#555" }}>{line}</Text>
        ))}
        <Text
          style={{
            marginTop: 3,
            fontSize: 8,
            color: omitSello ? "#92400e" : "#555",
            fontWeight: omitSello ? "bold" : "normal",
          }}
        >
          {disc}
        </Text>
      </View>
    </View>
  )
}

/**
 * Mirrors the canonical `buildFooterLines(doctor, clinic)` from
 * `lib/pdf/header-logic.ts` so the FirmaBloque stays self-contained
 * and the per-PDF generators can drop the explicit footer line map.
 * If you change one, change the other.
 */
import { formatDoctorName } from "@/lib/doctor-utils"

function buildFooterLinesLocal(
  doctor: { prefijo?: string; nombre: string; apellido?: string; especialidad?: string; cedula?: string; telefono?: string; email?: string },
  clinic?: { nombre?: string; direccionFiscal?: string; telefono?: string; email?: string } | null,
): string[] {
  const line1 = formatDoctorName(doctor)
  const parts: string[] = []
  if (line1) parts.push(line1)
  if (doctor.especialidad) parts.push(doctor.especialidad)
  if (doctor.cedula) parts.push(`C.I./C.M. ${doctor.cedula}`)
  if (clinic?.nombre) parts.push(clinic.nombre)
  const contact = [doctor.telefono, doctor.email, clinic?.telefono, clinic?.email]
    .filter(Boolean)
    .join(" | ")
  if (contact) parts.push(contact)
  return parts
}


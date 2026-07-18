import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { buildPdfHeader, buildFooterLines, type DoctorInfo, type ClinicInfo, type PdfBranding } from "./header-logic"
import { PreviewWatermark } from "./preview-watermark"
import { SelloFirma, FirmaBloque } from "./sello-firma"

/**
 * Receta médica "dúo" — página horizontal dividida exactamente por la mitad.
 *
 * Concepto: el doctor imprime UNA hoja, la rompe por la mitad al entregar
 * y reparte:
 *   - Mitad izquierda (Rp)        → farmacia
 *   - Mitad derecha (Indicaciones) → paciente
 *
 * Para que cada mitad funcione como documento independiente al recortarla:
 *   • Cada mitad tiene su propio encabezado (logo, doctor, paciente, fecha).
 *   • Cada mitad tiene su propio pie (firma, contacto, validez).
 *   • La mitad del paciente repite el nombre del medicamento al lado de
 *     cada indicación, así no queda ambigua si la hoja se separa y el
 *     farmacéutico devuelve solo las indicaciones sin el nombre.
 *
 * Layout: landscape A4, 50% / 50% exacto, divisor vertical 1pt en el medio.
 */
const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 9.5, fontFamily: "Helvetica", color: "#111" },

  halves: { flexDirection: "row", flex: 1 },
  half: {
    width: "50%",
    padding: 24,
    position: "relative",
    flexDirection: "column",
  },
  divider: { width: 1, backgroundColor: "#444" },

  // ─── Header (per half) ───
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 8,
    marginBottom: 10,
  },
  logo: { width: 42, height: 42, objectFit: "contain", marginRight: 10 },
  headerText: { flex: 1 },
  titulo: { fontSize: 13, fontWeight: "bold", color: "#111" },
  subtitulo: { fontSize: 10, marginTop: 2, color: "#222" },
  linea: { fontSize: 8.5, color: "#555", marginTop: 0.5 },
  docTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
    color: "#111",
  },
  patientRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 8.5,
    color: "#333",
    gap: 10,
  },

  // ─── Allergies banner ───
  // Rendered in BOTH halves (patient + pharmacy) so it can't be missed
  // when the sheet is split. The clinic and the patient must both see
  // the contraindication before dispensing.
  alergiasBanner: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1.2,
    borderColor: "#b91c1c",
    backgroundColor: "#fef2f2",
    borderRadius: 2,
  },
  alergiasTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#7f1d1d",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  alergiasItem: { fontSize: 8.5, color: "#7f1d1d", marginLeft: 4, marginBottom: 1 },
  alergiasSevera: { fontSize: 8.5, color: "#7f1d1d", fontWeight: "bold", marginLeft: 4 },
  alergiasItemOverride: {
    fontSize: 8.5,
    color: "#7f1d1d",
    fontStyle: "italic",
    marginTop: 3,
  },
  overrideBadge: {
    position: "absolute",
    top: -2,
    right: 0,
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },

  // ─── Body ───
  body: { flex: 1, paddingTop: 4 },
  colTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  medName: { fontSize: 11, fontWeight: "bold", marginBottom: 1, color: "#111" },
  medConc: { fontSize: 9, color: "#555", marginBottom: 8 },
  medNumber: {
    position: "absolute",
    top: -2,
    right: 0,
    fontSize: 8,
    color: "#888",
  },
  medBlock: { position: "relative", marginBottom: 10 },
  indiItem: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: "0.5pt dotted #bbb",
  },
  indiLastItem: { marginBottom: 12 },
  indiMedHeader: { fontSize: 9.5, fontWeight: "bold", color: "#111", marginBottom: 2 },
  indiMedConc: { fontSize: 8.5, color: "#555", marginBottom: 3 },
  indiText: { fontSize: 10, lineHeight: 1.4, color: "#111" },
  indiNote: { fontSize: 8.5, color: "#666", fontStyle: "italic", marginTop: 2 },

  // ─── Footer (per half) ───
  // No borderTop here — the closing line lives inside FirmaBloque
  // (after the sello, before the doctor data), which is the legal
  // document order: sello first, then line, then data.
  footer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    fontSize: 8,
    color: "#555",
  },
  footerSignature: { fontSize: 9, color: "#111", marginBottom: 2 },
})

interface PrescriptionItem {
  nombreGenerico: string
  concentracion: string
  dosis: string
  frecuencia: string
  duracion: string
  indicacionesEspeciales?: string
  /**
   * `true` means the doctor explicitly overrode a drug–allergy
   * interaction warning for this medication. We surface a "⚠ OVR"
   * badge on the receta so the pharmacist sees the override happened
   * (and the audit log captured it server-side).
   */
  overrideAlerta?: boolean
}

export interface PdfAlergia {
  sustancia: string
  gravedad: "LEVE" | "MODERADA" | "SEVERA" | null
  reaccion: string | null
}

export interface PrescriptionPdfProps {
  doctor: DoctorInfo
  clinic?: ClinicInfo | null
  branding?: PdfBranding
  paciente: { nombre: string; apellido: string; edad: number | string; cedula?: string }
  fecha: string
  items: PrescriptionItem[]
  /**
   * Patient's active allergies. When non-empty, a prominent red banner
   * is rendered in BOTH halves (farmacia + paciente) so the contraindication
   * is visible regardless of which half of the sheet the reader holds.
   */
  alergias?: PdfAlergia[]
  /**
   * Patient-portal preview: hides sello + signature line and adds an
   * explicit "VISTA PREVIA" watermark. Default `false`.
   * See lib/pdf/preview-watermark.tsx.
   */
  omitSello?: boolean
}

function HalfHeader({
  branding,
  h,
  docTitle,
  paciente,
  fecha,
  nombreCompleto,
  alergias,
  hasOverride,
}: {
  branding?: PdfBranding
  h: ReturnType<typeof buildPdfHeader>
  docTitle: string
  paciente: PrescriptionPdfProps["paciente"]
  fecha: string
  nombreCompleto: string
  alergias?: PdfAlergia[]
  /** True when at least one item in this receta was added with overrideAlerta. */
  hasOverride?: boolean
}) {
  return (
    <View style={styles.header}>
      {branding?.logoPath ? <Image src={branding.logoPath} style={styles.logo} /> : null}
      <View style={styles.headerText}>
        <Text style={styles.titulo}>{h.titulo}</Text>
        {h.subtitulo ? <Text style={styles.subtitulo}>{h.subtitulo}</Text> : null}
        {h.subEspecialidades && h.subEspecialidades.map((sub, i) => (
          <Text key={i} style={styles.subtitulo}>{sub}</Text>
        ))}
        {h.lineas.map((l, i) => (
          <Text key={i} style={styles.linea}>{l}</Text>
        ))}
        <Text style={styles.docTitle}>{docTitle}</Text>
        <View style={styles.patientRow}>
          <Text>Paciente: {nombreCompleto}</Text>
          {paciente.cedula ? <Text>C.I.: {paciente.cedula}</Text> : null}
          <Text>Edad: {paciente.edad} años</Text>
          <Text>Fecha: {fecha}</Text>
        </View>
        {alergias && alergias.length > 0 ? (
          <View style={styles.alergiasBanner}>
            <Text style={styles.alergiasTitle}>
              ⚠ ALERGIAS DEL PACIENTE — verificar antes de dispensar
            </Text>
            {alergias.map((a, i) => (
              <Text
                key={i}
                style={a.gravedad === "SEVERA" ? styles.alergiasSevera : styles.alergiasItem}
              >
                • {a.sustancia}
                {a.gravedad ? ` [${a.gravedad}]` : ""}
                {a.reaccion ? ` — reacción: ${a.reaccion}` : ""}
              </Text>
            ))}
            {hasOverride ? (
              <Text style={styles.alergiasItemOverride}>
                Esta receta incluye medicamentos en override de alergia. Verificar justificación clínica.
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  )
}

function HalfFooter({ doctor, clinic, branding, omitSello }: { doctor: DoctorInfo; clinic?: ClinicInfo | null; branding?: PdfBranding; omitSello?: boolean }) {
  return (
    <View style={styles.footer}>
      <FirmaBloque
        doctor={doctor}
        clinic={clinic ?? null}
        branding={branding}
        omitSello={omitSello}
        disclaimer={omitSello ? "⚠ Vista previa — sin validez legal sin firma y sello" : undefined}
      />
    </View>
  )
}

export function PrescriptionPdf({ doctor, clinic, branding, paciente, fecha, items, alergias, omitSello }: PrescriptionPdfProps) {
  const h = buildPdfHeader(doctor, clinic)
  const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`
  const hasOverride = items.some((it) => it.overrideAlerta)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {omitSello && (
          <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
            <PreviewWatermark />
          </View>
        )}
        <View style={styles.halves}>
          {/* ═══ MITAD IZQUIERDA — para la FARMACIA ═══ */}
          <View style={styles.half}>
            <HalfHeader
              branding={branding}
              h={h}
              docTitle="Receta Médica — Rp"
              paciente={paciente}
              fecha={fecha}
              nombreCompleto={nombreCompleto}
              alergias={alergias}
              hasOverride={hasOverride}
            />

            <View style={styles.body}>
              <Text style={styles.colTitle}>Rp</Text>
              {items.map((item, i) => (
                <View key={i} style={styles.medBlock}>
                  {item.overrideAlerta ? (
                    <Text style={styles.overrideBadge}>⚠ OVR ALERGIA</Text>
                  ) : null}
                  <Text style={styles.medNumber}>{i + 1}</Text>
                  <Text style={styles.medName}>{item.nombreGenerico}</Text>
                  <Text style={styles.medConc}>{item.concentracion}</Text>
                </View>
              ))}
            </View>

            <HalfFooter doctor={doctor} clinic={clinic} branding={branding} omitSello={omitSello} />
          </View>

          {/* ─── Divisor vertical (línea de corte) ─── */}
          <View style={styles.divider} />

          {/* ═══ MITAD DERECHA — para el PACIENTE ═══ */}
          <View style={styles.half}>
            <HalfHeader
              branding={branding}
              h={h}
              docTitle="Receta Médica — Indicaciones"
              paciente={paciente}
              fecha={fecha}
              nombreCompleto={nombreCompleto}
              alergias={alergias}
              hasOverride={hasOverride}
            />

            <View style={styles.body}>
              <Text style={styles.colTitle}>Indicaciones</Text>
              {items.map((item, i) => {
                const main = [item.dosis, item.frecuencia, `por ${item.duracion}`]
                  .filter(Boolean)
                  .join(" ")
                const isLast = i === items.length - 1
                return (
                  <View
                    key={i}
                    style={isLast ? styles.indiLastItem : styles.indiItem}
                  >
                    <Text style={styles.indiMedHeader}>
                      {i + 1}. {item.nombreGenerico}
                      {item.overrideAlerta ? "  ⚠ OVR" : ""}
                    </Text>
                    {item.concentracion ? (
                      <Text style={styles.indiMedConc}>{item.concentracion}</Text>
                    ) : null}
                    <Text style={styles.indiText}>{main}</Text>
                    {item.indicacionesEspeciales ? (
                      <Text style={styles.indiNote}>{item.indicacionesEspeciales}</Text>
                    ) : null}
                  </View>
                )
              })}
            </View>

            <HalfFooter doctor={doctor} clinic={clinic} branding={branding} omitSello={omitSello} />
          </View>
        </View>
      </Page>
    </Document>
  )
}
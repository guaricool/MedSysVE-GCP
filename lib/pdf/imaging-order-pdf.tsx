import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { buildPdfHeader, buildFooterLines, type DoctorInfo, type ClinicInfo, type PdfBranding } from "./header-logic"
import { PreviewWatermark } from "./preview-watermark"
import { SelloFirma, FirmaBloque } from "./sello-firma"

/**
 * Orden de imagenología — página horizontal dividida 50/50.
 *
 * Concepto: el doctor imprime UNA hoja y la rompe por la mitad:
 *   - Mitad izquierda (Estudios + justificación clínica) → centro de imagen
 *   - Mitad derecha (Indicaciones para el paciente)      → paciente
 *
 * Cada mitad tiene header y footer completos para que el documento siga
 * siendo identificable y válido después de cortarse por la mitad.
 */
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9.5, fontFamily: "Helvetica", color: "#111", position: "relative" },

  // ─── Header ───
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottom: "1pt solid #333",
    paddingBottom: 8,
    marginBottom: 15,
  },
  logo: { width: 50, height: 50, objectFit: "contain", marginRight: 15 },
  headerText: { flex: 1 },
  titulo: { fontSize: 14, fontWeight: "bold", color: "#111" },
  subtitulo: { fontSize: 11, marginTop: 2, color: "#222" },
  linea: { fontSize: 9.5, color: "#555", marginTop: 0.5 },
  docTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
    color: "#111",
  },
  patientRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 9.5,
    color: "#333",
    gap: 15,
  },
  urgenteBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 9.5,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginTop: 5,
  },

  // ─── Body ───
  body: { flex: 1, paddingTop: 10 },
  colTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  studyItem: { marginBottom: 12, paddingBottom: 8, borderBottom: "0.5pt dotted #bbb" },
  studyType: { fontSize: 12, fontWeight: "bold", color: "#111" },
  studyRegion: { fontSize: 10.5, color: "#444", marginTop: 2 },
  studyNotas: { fontSize: 9.5, color: "#666", fontStyle: "italic", marginTop: 2 },
  dxBox: { fontSize: 11, lineHeight: 1.45, color: "#222" },

  // ─── Footer ───
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    // No borderTop — closing line lives inside FirmaBloque.
    fontSize: 9,
    color: "#555",
  },
  footerSignature: { fontSize: 10, color: "#111", marginBottom: 4 },
})

export interface ImagingStudyItem {
  tipoImagen: string
  region: string
  notas?: string | null
}

export interface ImagingOrderPdfProps {
  doctor: DoctorInfo
  clinic?: ClinicInfo | null
  branding?: PdfBranding
  paciente: { nombre: string; apellido: string; edad: number | string; cedula?: string }
  fecha: string
  items: ImagingStudyItem[]
  // Free-text clinical justification shared across all studies on this
  // order — matches Dr. Pierluissis's "dx: ..." column.
  indicacionesClinicas?: string | null
  urgente: boolean
  numero: string
  /**
   * Patient-portal preview: hides sello + signature line and adds an
   * explicit "VISTA PREVIA" watermark. Default `false`.
   */
  omitSello?: boolean
}

function PageHeader({
  branding,
  h,
  docTitle,
  paciente,
  fecha,
  nombreCompleto,
  urgente,
  numero,
}: {
  branding?: PdfBranding
  h: ReturnType<typeof buildPdfHeader>
  docTitle: string
  paciente: ImagingOrderPdfProps["paciente"]
  fecha: string
  nombreCompleto: string
  urgente: boolean
  numero: string
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
        <Text style={styles.docTitle}>{docTitle} — Orden Nº {numero}</Text>
        {urgente ? (
          <View style={styles.urgenteBadge}>
            <Text>⚠ URGENTE</Text>
          </View>
        ) : null}
        <View style={[styles.patientRow, { marginTop: 6 }]}>
          <Text>Paciente: {nombreCompleto}</Text>
          {paciente.cedula ? <Text>C.I.: {paciente.cedula}</Text> : null}
          <Text>Edad: {paciente.edad} años</Text>
          <Text>Fecha: {fecha}</Text>
        </View>
      </View>
    </View>
  )
}

function PageFooter({ doctor, clinic, branding, omitSello }: { doctor: DoctorInfo; clinic?: ClinicInfo | null; branding?: PdfBranding; omitSello?: boolean }) {
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

export function ImagingOrderPdf({
  doctor,
  clinic,
  branding,
  paciente,
  fecha,
  items,
  indicacionesClinicas,
  urgente,
  numero,
  omitSello,
}: ImagingOrderPdfProps) {
  const h = buildPdfHeader(doctor, clinic)
  const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {omitSello && <PreviewWatermark />}
        <PageHeader
          branding={branding}
          h={h}
          docTitle="Orden de Imagenología"
          paciente={paciente}
          fecha={fecha}
          nombreCompleto={nombreCompleto}
          urgente={urgente}
          numero={numero}
        />

        <View style={styles.body}>
          <Text style={styles.colTitle}>Estudios solicitados</Text>
          {items.length === 0 ? (
            <Text style={styles.studyNotas}>Sin estudios registrados.</Text>
          ) : (
            items.map((it, i) => (
              <View key={i} style={styles.studyItem}>
                <Text style={styles.studyType}>
                  {i + 1}. {it.tipoImagen}
                </Text>
                <Text style={styles.studyRegion}>{it.region}</Text>
                {it.notas ? <Text style={styles.studyNotas}>{it.notas}</Text> : null}
              </View>
            ))
          )}

          <Text style={[styles.colTitle, { marginTop: 16 }]}>Diagnóstico / Justificación clínica</Text>
          <Text style={styles.dxBox}>
            {indicacionesClinicas && indicacionesClinicas.trim().length > 0
              ? indicacionesClinicas
              : "Sin indicación clínica registrada."}
          </Text>
        </View>

        <PageFooter doctor={doctor} clinic={clinic} branding={branding} omitSello={omitSello} />
      </Page>
    </Document>
  )
}
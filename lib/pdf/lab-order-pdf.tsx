import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { buildPdfHeader, buildFooterLines, type DoctorInfo, type ClinicInfo, type PdfBranding } from "./header-logic"
import { SharedPdfHeader } from "./shared-header"
import { PreviewWatermark } from "./preview-watermark"
import { SelloFirma, FirmaBloque } from "./sello-firma"

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica" },
  header: { borderBottom: "1pt solid #333", paddingBottom: 10, marginBottom: 20 },
  logo: { width: 56, height: 56, objectFit: "contain", marginRight: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  titulo: { fontSize: 16, fontWeight: "bold" },
  subtitulo: { fontSize: 12, marginTop: 3 },
  linea: { fontSize: 9, color: "#555", marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 10, textTransform: "uppercase" },
  patientRow: { flexDirection: "row", gap: 16, marginBottom: 16, fontSize: 10, color: "#333" },
  urgenteBadge: { backgroundColor: "#fee2e2", color: "#991b1b", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: "bold", marginBottom: 8 },
  estudiosBox: { border: "1pt solid #ccc", borderRadius: 4, padding: 10, marginBottom: 12 },
  estudioItem: { fontSize: 11, marginBottom: 4 },
  bullet: { fontSize: 11, marginRight: 6 },
  indicaciones: { fontSize: 10, color: "#555", marginTop: 8, fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 48,
    right: 48,
    // No borderTop — closing line lives inside FirmaBloque.
    fontSize: 9,
    color: "#555",
  },
})

export interface LabOrderPdfProps {
  doctor: DoctorInfo
  clinic?: ClinicInfo | null
  branding?: PdfBranding
  paciente: { nombre: string; apellido: string; edad: number | string; cedula?: string }
  fecha: string
  estudios: string[]
  indicacionesClinicas?: string
  urgente: boolean
  numero: string
  /**
   * Patient-portal preview: hides sello + signature line and adds an
   * explicit "VISTA PREVIA" watermark. Default `false`.
   */
  omitSello?: boolean
}

export function LabOrderPdf({ doctor, clinic, branding, paciente, fecha, estudios, indicacionesClinicas, urgente, numero, omitSello }: LabOrderPdfProps) {
  const h = buildPdfHeader(doctor, clinic)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {omitSello && <PreviewWatermark />}
        <SharedPdfHeader doctor={doctor} clinic={clinic} branding={branding} />

        <Text style={styles.sectionTitle}>Orden de Laboratorio Nº {numero}</Text>

        <View style={styles.patientRow}>
          <Text>Paciente: {paciente.nombre} {paciente.apellido}</Text>
          {paciente.cedula ? <Text>C.I.: {paciente.cedula}</Text> : null}
          <Text>Edad: {paciente.edad} años</Text>
          <Text>Fecha: {fecha}</Text>
        </View>

        {urgente && (
          <View style={styles.urgenteBadge}>
            <Text>⚠ URGENTE</Text>
          </View>
        )}

        <View style={styles.estudiosBox}>
          <Text style={{ fontSize: 10, color: "#666", marginBottom: 8 }}>Estudios solicitados:</Text>
          {estudios.map((e, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.estudioItem}>{e}</Text>
            </View>
          ))}
          {indicacionesClinicas && (
            <Text style={styles.indicaciones}>Indicaciones: {indicacionesClinicas}</Text>
          )}
        </View>

<View style={styles.footer}>
          <FirmaBloque
            doctor={doctor}
            clinic={clinic ?? null}
            branding={branding}
            omitSello={omitSello}
            disclaimer={omitSello ? "⚠ Vista previa — sin validez legal sin firma y sello" : undefined}
          />
        </View>
      </Page>
    </Document>
  )
}

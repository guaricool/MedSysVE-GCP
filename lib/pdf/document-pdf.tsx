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
  tipoLabel: { fontSize: 13, fontWeight: "bold", marginBottom: 10, textTransform: "uppercase" },
  patient: { marginBottom: 16, fontSize: 10, color: "#333" },
  body: { lineHeight: 1.6 },
  paragraph: { marginBottom: 8 },
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

const TIPO_LABELS: Record<string, string> = {
  INFORME: "Informe Médico",
  REPOSO: "Reposo Médico",
  REFERIDO: "Referido Médico",
  CERTIFICADO: "Certificado Médico",
  RECETA: "Receta Médica",
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim()
}

export interface DocumentPdfProps {
  doctor: DoctorInfo
  clinic?: ClinicInfo | null
  branding?: PdfBranding
  tipo: string
  paciente: { nombre: string; apellido: string; edad: number | string; cedula?: string }
  fecha: string
  contenidoHtml: string
  /**
   * Only set for REFERIDO documents. Surfaces "To: Dr. X (Especialidad)"
   * prominently on the first page so the receiving doctor immediately sees
   * who the referral is for.
   */
  referidoA?: {
    nombre: string
    especialidad?: string
    telefono?: string
  }
  /**
   * Patient-portal preview: hides sello + signature line and replaces
   * the "Válido solo con firma y sello" disclaimer with an explicit
   * "VISTA PREVIA" watermark. Default `false` (full legal version).
   * See lib/pdf/preview-watermark.tsx for the watermark styles.
   */
  omitSello?: boolean
}

export function DocumentPdf({ doctor, clinic, branding, tipo, paciente, fecha, contenidoHtml, referidoA, omitSello }: DocumentPdfProps) {
  const h = buildPdfHeader(doctor, clinic)
  const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`
  const tipoLabel = TIPO_LABELS[tipo] ?? tipo
  const contenido = stripHtml(contenidoHtml)
  const paragraphs = contenido.split("\n").filter((p) => p.trim())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {omitSello && <PreviewWatermark />}
        <SharedPdfHeader doctor={doctor} clinic={clinic} branding={branding} />

        <Text style={styles.tipoLabel}>{tipoLabel}</Text>

        <View style={styles.patient}>
          <Text>
            Paciente: {nombreCompleto}
            {paciente.cedula ? `  •  C.I.: ${paciente.cedula}` : ""}
          </Text>
          <Text>
            Edad: {paciente.edad}  •  Fecha: {fecha}
          </Text>
        </View>

        {referidoA && (
          <View style={{ marginBottom: 14, padding: 8, borderWidth: 1, borderColor: "#333", borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: "#555", marginBottom: 2 }}>Dirigido a:</Text>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>{referidoA.nombre}</Text>
            {referidoA.especialidad && (
              <Text style={{ fontSize: 10, color: "#333" }}>{referidoA.especialidad}</Text>
            )}
            {referidoA.telefono && (
              <Text style={{ fontSize: 10, color: "#555" }}>Tel: {referidoA.telefono}</Text>
            )}
          </View>
        )}

        <View style={styles.body}>
          {paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}
        </View>

<View style={styles.footer}>
          <FirmaBloque
            doctor={doctor}
            clinic={clinic ?? null}
            branding={branding}
            omitSello={omitSello}
            disclaimer={omitSello ? "⚠ Vista previa generada desde el portal del paciente. No constituye documento válido sin la firma y sello del médico." : undefined}
          />
        </View>
      </Page>
    </Document>
  )
}

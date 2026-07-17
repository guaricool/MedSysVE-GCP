import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { buildPdfHeader, buildFooterLines, type DoctorInfo, type ClinicInfo, type PdfBranding } from "./header-logic"
import { SharedPdfHeader } from "./shared-header"

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica" },
  header: { borderBottom: "1pt solid #333", paddingBottom: 10, marginBottom: 20 },
  logo: { width: 56, height: 56, objectFit: "contain", marginRight: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  titulo: { fontSize: 16, fontWeight: "bold" },
  subtitulo: { fontSize: 12, marginTop: 3 },
  linea: { fontSize: 9, color: "#555", marginTop: 2 },
  facturaTitulo: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  numero: { fontSize: 11, color: "#555", marginBottom: 16 },
  infoGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  infoBox: { width: "45%" },
  infoLabel: { fontSize: 9, color: "#777", marginBottom: 2, textTransform: "uppercase" },
  infoValue: { fontSize: 11 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: "row", borderBottom: "1pt solid #333", paddingBottom: 4, marginBottom: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 4, borderBottom: "1pt solid #eee" },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  tableHeaderText: { fontSize: 9, fontWeight: "bold", color: "#555", textTransform: "uppercase" },
  tableCell: { fontSize: 11 },
  totalsBox: {
    marginTop: 16,
    borderTop: "1pt solid #333",
    paddingTop: 10,
    alignItems: "flex-end",
  },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 24, marginBottom: 4 },
  totalLabel: { fontSize: 10, color: "#555", width: 120, textAlign: "right" },
  totalValue: { fontSize: 11, width: 80, textAlign: "right" },
  totalPrincipal: { fontSize: 13, fontWeight: "bold" },
  statusBadge: { marginTop: 12, fontSize: 10, color: "#555" },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
})

interface InvoicePdfProps {
  doctor: DoctorInfo & { rif?: string }
  clinic?: (ClinicInfo & { rif?: string }) | null
  branding?: PdfBranding
  invoice: {
    numero: string
    fecha: string
    descripcion: string
    montoUsd: number
    tasaBcv: number
    montoBs: number
    metodoPago: string
    status: string
  }
  paciente: { nombre: string; apellido: string; edad: number | string; cedula?: string }
}

export function InvoicePdf({ doctor, clinic, invoice, paciente, branding }: InvoicePdfProps) {
  const h = buildPdfHeader(doctor, clinic)
  const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`
  const hasBs = invoice.tasaBcv > 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SharedPdfHeader doctor={doctor} clinic={clinic} branding={branding} />

        <Text style={styles.facturaTitulo}>RECIBO DE PAGO</Text>
        <Text style={styles.numero}>N° {invoice.numero}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Paciente</Text>
            <Text style={styles.infoValue}>{nombreCompleto}</Text>
            {paciente.cedula ? <Text style={styles.infoValue}>C.I.: {paciente.cedula}</Text> : null}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Fecha de emisión</Text>
            <Text style={styles.infoValue}>{invoice.fecha}</Text>
            <Text style={[styles.infoLabel, { marginTop: 8 }]}>Método de pago</Text>
            <Text style={styles.infoValue}>{invoice.metodoPago}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Descripción</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Monto</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.col1]}>{invoice.descripcion}</Text>
            <Text style={[styles.tableCell, styles.col2]}>${invoice.montoUsd.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.totalPrincipal]}>Total USD</Text>
            <Text style={[styles.totalValue, styles.totalPrincipal]}>${invoice.montoUsd.toFixed(2)}</Text>
          </View>
          {hasBs && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tasa BCV</Text>
                <Text style={styles.totalValue}>Bs {invoice.tasaBcv.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Bs</Text>
                <Text style={styles.totalValue}>Bs {invoice.montoBs.toFixed(2)}</Text>
              </View>
            </>
          )}
          <Text style={styles.statusBadge}>
            Estado: {invoice.status === "PAID" ? "PAGADO" : invoice.status === "CANCELLED" ? "CANCELADO" : "PENDIENTE"}
          </Text>
        </View>

        <View style={styles.footer}>
          {buildFooterLines(doctor, clinic).map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
          <Text style={{ marginTop: 4 }}>Documento generado por MedSysVE — Este recibo no constituye factura fiscal</Text>
        </View>
      </Page>
    </Document>
  )
}

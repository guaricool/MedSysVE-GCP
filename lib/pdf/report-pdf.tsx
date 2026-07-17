import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { buildPdfHeader, buildFooterLines, type DoctorInfo, type ClinicInfo, type PdfBranding } from "./header-logic"
import { SharedPdfHeader } from "./shared-header"

const S = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#374151" },
  header: { borderBottomWidth: 1, borderBottomColor: "#1e3a5f", paddingBottom: 10, marginBottom: 18 },
  logo: { width: 56, height: 56, objectFit: "contain", marginRight: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  headerTitulo: { fontSize: 15, fontWeight: "bold", color: "#1e3a5f" },
  headerSub: { fontSize: 11, marginTop: 2 },
  headerLinea: { fontSize: 9, color: "#6b7280", marginTop: 1 },
  title: { fontSize: 13, fontWeight: "bold", color: "#1e3a5f", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 20 },
  sectionTitle: {
    fontSize: 10, fontWeight: "bold", color: "#1e3a5f", textTransform: "uppercase",
    borderBottomWidth: 1, borderBottomColor: "#dbeafe", paddingBottom: 3, marginBottom: 10,
  },
  statRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4,
    padding: 10, alignItems: "center",
  },
  statLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#1e3a5f" },
  statSub: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  table: { marginBottom: 16 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingVertical: 5 },
  tableHeader: { backgroundColor: "#f8fafc" },
  col1: { flex: 2, fontSize: 9 },
  col2: { flex: 1, fontSize: 9, textAlign: "right" },
  col3: { flex: 1, fontSize: 9, textAlign: "right" },
  total: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, gap: 8 },
  totalLabel: { fontSize: 10, fontWeight: "bold", color: "#374151" },
  totalValue: { fontSize: 10, fontWeight: "bold", color: "#1e3a5f" },
  footer: {
    position: "absolute", bottom: 32, left: 48, right: 48,
    borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 6,
    fontSize: 8, color: "#9ca3af", flexDirection: "row", justifyContent: "space-between",
  },
  methodRow: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: 4,
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  methodLabel: { fontSize: 9, color: "#374151" },
  methodValue: { fontSize: 9, fontWeight: "bold", color: "#1e3a5f" },
})

const METODO_LABELS: Record<string, string> = {
  EFECTIVO_USD: "Efectivo USD",
  EFECTIVO_BS: "Efectivo Bs",
  TRANSFERENCIA_BS: "Transferencia Bs",
  ZELLE: "Zelle",
  BINANCE_USDT: "Binance USDT",
  PAGOMOVIL: "Pago Móvil",
}

export interface ReportInvoice {
  numero: string
  patientName: string
  fecha: string
  montoUsd: number
  montoBs: number
  metodoPago: string
  status: string
}

export interface ReportPdfProps {
  doctor: DoctorInfo
  clinic: ClinicInfo | null
  branding?: PdfBranding
  mes: string
  generadoEl: string
  totalUsd: number
  totalBs: number
  totalFacturas: number
  totalPagadas: number
  totalPendientes: number
  totalCanceladas: number
  porMetodo: { metodo: string; count: number; totalUsd: number }[]
  invoices: ReportInvoice[]
}

export function ReportPdf({
  doctor, clinic, branding, mes, generadoEl,
  totalUsd, totalFacturas, totalPagadas, totalPendientes, totalCanceladas,
  porMetodo, invoices,
}: ReportPdfProps) {
  const hdr = buildPdfHeader(doctor, clinic)

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <SharedPdfHeader doctor={doctor} clinic={clinic} branding={branding} />

        <Text style={S.title}>Reporte Mensual de Facturación</Text>
        <Text style={S.subtitle}>Período: {mes} · Generado el {generadoEl}</Text>

        <View style={S.statRow}>
          <View style={S.statBox}>
            <Text style={S.statLabel}>Total facturas</Text>
            <Text style={S.statValue}>{totalFacturas}</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statLabel}>Pagadas</Text>
            <Text style={S.statValue}>{totalPagadas}</Text>
            <Text style={S.statSub}>${totalUsd.toFixed(2)} USD</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statLabel}>Pendientes</Text>
            <Text style={S.statValue}>{totalPendientes}</Text>
          </View>
          <View style={S.statBox}>
            <Text style={S.statLabel}>Canceladas</Text>
            <Text style={S.statValue}>{totalCanceladas}</Text>
          </View>
        </View>

        {porMetodo.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={S.sectionTitle}>Por método de pago</Text>
            {porMetodo.map((m, i) => (
              <View key={i} style={S.methodRow}>
                <Text style={S.methodLabel}>{METODO_LABELS[m.metodo] ?? m.metodo} ({m.count})</Text>
                <Text style={S.methodValue}>${m.totalUsd.toFixed(2)} USD</Text>
              </View>
            ))}
          </View>
        )}

        <View style={S.table}>
          <Text style={S.sectionTitle}>Detalle de facturas</Text>
          <View style={[S.tableRow, S.tableHeader]}>
            <Text style={[S.col1, { fontWeight: "bold", fontSize: 8, color: "#6b7280" }]}>PACIENTE / Nº</Text>
            <Text style={[S.col2, { fontWeight: "bold", fontSize: 8, color: "#6b7280" }]}>MONTO USD</Text>
            <Text style={[S.col3, { fontWeight: "bold", fontSize: 8, color: "#6b7280" }]}>ESTADO</Text>
          </View>
          {invoices.map((inv, i) => (
            <View key={i} style={S.tableRow}>
              <View style={S.col1}>
                <Text style={{ fontSize: 9, color: "#374151" }}>{inv.patientName}</Text>
                <Text style={{ fontSize: 8, color: "#9ca3af" }}>{inv.numero} · {inv.fecha}</Text>
              </View>
              <Text style={S.col2}>${inv.montoUsd.toFixed(2)}</Text>
              <Text style={[S.col3, {
                color: inv.status === "PAID" ? "#059669" : inv.status === "CANCELLED" ? "#9ca3af" : "#d97706",
              }]}>
                {inv.status === "PAID" ? "Pagada" : inv.status === "CANCELLED" ? "Cancelada" : "Pendiente"}
              </Text>
            </View>
          ))}
        </View>

        <View style={S.total}>
          <Text style={S.totalLabel}>Total cobrado:</Text>
          <Text style={S.totalValue}>${totalUsd.toFixed(2)} USD</Text>
        </View>

        <View style={S.footer} fixed>
          {buildFooterLines(doctor, clinic).map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
          <Text>{generadoEl}</Text>
        </View>
      </Page>
    </Document>
  )
}

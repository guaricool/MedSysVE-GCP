import React from "react"
import { buildFooterLines, type PdfBranding, type DoctorInfo, type ClinicInfo } from "./header-logic"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: "#1e293b", padding: 32, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #0ea5e9" },
  logo: { width: 56, height: 56, objectFit: "contain", marginRight: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  headerLeft: { flex: 1 },
  clinicName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0c4a6e" },
  doctorName: { fontSize: 9, color: "#475569", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  docTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0ea5e9" },
  docSubtitle: { fontSize: 8, color: "#64748b", marginTop: 2 },
  sectionBox: { backgroundColor: "#f0f9ff", borderRadius: 4, padding: 10, marginBottom: 14, border: "1px solid #bae6fd" },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0369a1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  row: { flexDirection: "row", gap: 12, marginBottom: 3 },
  field: { flex: 1 },
  label: { fontSize: 7, color: "#64748b", marginBottom: 1 },
  value: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1e293b" },
  table: { marginBottom: 14 },
  tableHeader: { flexDirection: "row", backgroundColor: "#0ea5e9", padding: "5 8", borderRadius: 3 },
  tableRow: { flexDirection: "row", padding: "5 8", borderBottom: "1px solid #e2e8f0" },
  tableRowAlt: { flexDirection: "row", padding: "5 8", borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" },
  colVacuna: { flex: 3, fontSize: 8 },
  colFecha: { flex: 2, fontSize: 8 },
  colDosis: { flex: 1.5, fontSize: 8 },
  colProxima: { flex: 2, fontSize: 8 },
  colLote: { flex: 1.5, fontSize: 8 },
  colHeaderText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  cellText: { fontSize: 8, color: "#1e293b" },
  cellNote: { fontSize: 7, color: "#64748b", marginTop: 1 },
  emptyRow: { padding: "6 8", alignItems: "center" },
  emptyText: { fontSize: 8, color: "#94a3b8", fontStyle: "italic" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, borderTop: "1px solid #e2e8f0", paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94a3b8" },
  reminderBox: { backgroundColor: "#fff7ed", borderRadius: 4, padding: 8, border: "1px solid #fed7aa", marginBottom: 14 },
  reminderTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#c2410c", marginBottom: 3 },
  reminderItem: { fontSize: 7.5, color: "#9a3412", marginBottom: 1 },
  doctorText: { fontSize: 8, color: "#94a3b8", marginTop: 1 },
})

interface VaccineEntry {
  vacuna: string
  fechaAplicacion: string
  dosis?: string
  lote?: string
  proximaDosis?: string
  aplicadoPor?: string
  notas?: string
}

interface Props {
  doctor: DoctorInfo
  clinic: ClinicInfo | null
  patient: { nombre: string; apellido: string; edad: number; sexo: string; cedula?: string; fechaNacimiento: string }
  vaccines: VaccineEntry[]
  generadoEl: string
  branding?: PdfBranding
}

export function VaccineCarnetPdf({ doctor, clinic, patient, vaccines, generadoEl, branding }: Props) {
  const pending = vaccines.filter((v) => v.proximaDosis)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerLeft, styles.headerRow]}>
            {branding?.logoPath ? <Image src={branding.logoPath} style={styles.logo} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.clinicName}>{clinic?.nombre ?? "Consultorio Médico"}</Text>
              <Text style={styles.doctorName}>{doctor.nombre} — {doctor.especialidad}</Text>
              {doctor.subEspecialidades && doctor.subEspecialidades.map((sub, i) => (
                <Text key={i} style={[styles.doctorName, { marginTop: 1 }]}>{sub}</Text>
              ))}
              <Text style={styles.doctorText}>C.I. {doctor.cedula}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>CARNÉ DE VACUNACIÓN</Text>
            <Text style={styles.docSubtitle}>Registro Oficial de Inmunizaciones</Text>
            <Text style={styles.docSubtitle}>Emitido: {generadoEl}</Text>
          </View>
        </View>

        {/* Patient data */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Datos del Paciente</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Nombre completo</Text>
              <Text style={styles.value}>{patient.nombre} {patient.apellido}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Fecha de nacimiento</Text>
              <Text style={styles.value}>{patient.fechaNacimiento}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Edad</Text>
              <Text style={styles.value}>{patient.edad} años</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Cédula de identidad</Text>
              <Text style={styles.value}>{patient.cedula ?? "No registrada"}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Sexo</Text>
              <Text style={styles.value}>{patient.sexo === "MASCULINO" ? "Masculino" : patient.sexo === "FEMENINO" ? "Femenino" : "Otro"}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Total de vacunas registradas</Text>
              <Text style={styles.value}>{vaccines.length}</Text>
            </View>
          </View>
        </View>

        {/* Vaccine table */}
        <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Historial de Vacunación</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colVacuna, styles.colHeaderText]}>Vacuna</Text>
            <Text style={[styles.colFecha, styles.colHeaderText]}>Fecha</Text>
            <Text style={[styles.colDosis, styles.colHeaderText]}>Dosis</Text>
            <Text style={[styles.colLote, styles.colHeaderText]}>Lote</Text>
            <Text style={[styles.colProxima, styles.colHeaderText]}>Próxima dosis</Text>
          </View>

          {vaccines.length === 0 && (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No hay vacunas registradas</Text>
            </View>
          )}

          {vaccines.map((v, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <View style={styles.colVacuna}>
                <Text style={styles.cellText}>{v.vacuna}</Text>
                {v.aplicadoPor && <Text style={styles.cellNote}>Por: {v.aplicadoPor}</Text>}
                {v.notas && <Text style={styles.cellNote}>{v.notas}</Text>}
              </View>
              <Text style={[styles.colFecha, styles.cellText]}>{v.fechaAplicacion}</Text>
              <Text style={[styles.colDosis, styles.cellText]}>{v.dosis ?? "—"}</Text>
              <Text style={[styles.colLote, styles.cellText]}>{v.lote ?? "—"}</Text>
              <Text style={[styles.colProxima, styles.cellText]}>{v.proximaDosis ?? "—"}</Text>
            </View>
          ))}
        </View>

        {/* Pending doses reminder */}
        {pending.length > 0 && (
          <View style={styles.reminderBox}>
            <Text style={styles.reminderTitle}>⚠ Próximas dosis pendientes</Text>
            {pending.map((v, i) => (
              <Text key={i} style={styles.reminderItem}>
                • {v.vacuna} — {v.proximaDosis}
              </Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          {buildFooterLines(doctor, clinic).map((line, i) => (
            <Text key={i} style={styles.footerText}>{line}</Text>
          ))}
          <Text style={styles.footerText}>Carné generado · {generadoEl}</Text>
        </View>
      </Page>
    </Document>
  )
}


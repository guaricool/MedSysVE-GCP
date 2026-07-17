import React from "react"
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import { buildPdfHeader, type DoctorInfo, type ClinicInfo, type PdfBranding } from "./header-logic"

const styles = StyleSheet.create({
  header: { borderBottomWidth: 1, borderBottomColor: "#1e3a5f", paddingBottom: 6, marginBottom: 12 },
  logo: { width: 42, height: 42, objectFit: "contain", marginRight: 10 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerTitulo: { fontSize: 12, fontWeight: "bold", color: "#1e3a5f" },
  headerSub: { fontSize: 9, marginTop: 2, color: "#374151" },
  headerLinea: { fontSize: 8, color: "#6b7280", marginTop: 1 },
  leftCol: { flexDirection: "row", alignItems: "flex-start", flex: 1.5 },
  centerCol: { flex: 2, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  centerClinic: { fontSize: 10, fontWeight: "bold", color: "#1e3a5f", textTransform: "uppercase", marginBottom: 2, textAlign: "center" },
  centerClinicLine: { fontSize: 7.5, color: "#4b5563", marginBottom: 1, textAlign: "center" },
  centerTitle: { fontSize: 11, fontWeight: "bold", color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginTop: 4 },
  rightCol: { alignItems: "flex-end", maxWidth: 160, flex: 1.5, marginTop: 2 },
  specText: { fontSize: 7.5, color: "#4b5563", marginBottom: 1, textAlign: "right" },
})

export function SharedPdfHeader({
  doctor,
  clinic,
  branding,
  docTitle,
}: {
  doctor: DoctorInfo
  clinic?: ClinicInfo | null
  branding?: PdfBranding
  docTitle?: string
}) {
  const mainSpec = doctor.especialidad === "Traumatología" ? "Traumatología y ortopedia" : doctor.especialidad
  const subSpecs = (doctor.subEspecialidades ?? [])
    .map(s => s === "Traumatología" ? "Traumatología y ortopedia" : s)
    .filter(Boolean)

  const uniqueList = Array.from(new Set([mainSpec, ...subSpecs])).filter(Boolean) as string[]

  const isClinic = !!clinic

  const leftTitle = doctor.nombre
  const leftLines = [doctor.cedula ? `C.I.: ${doctor.cedula}` : ""].filter(Boolean)

  const centerClinicName = isClinic ? clinic.nombre : null
  const centerClinicLines = isClinic
    ? [clinic.direccion, clinic.telefono ? `Tel: ${clinic.telefono}` : ""].filter(Boolean)
    : []

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {/* Left Column: Doctor Identity & Logo */}
        <View style={styles.leftCol}>
          {branding?.logoPath ? <Image src={branding.logoPath} style={styles.logo} /> : null}
          <View>
            <Text style={styles.headerTitulo}>{leftTitle}</Text>
            {leftLines.map((l, i) => (
              <Text key={i} style={styles.headerLinea}>{l}</Text>
            ))}
          </View>
        </View>

        {/* Center Column: Clinic Identity & Doc Title */}
        <View style={styles.centerCol}>
          {centerClinicName ? (
            <Text style={styles.centerClinic}>{centerClinicName}</Text>
          ) : null}
          {centerClinicLines.map((l, i) => (
            <Text key={i} style={styles.centerClinicLine}>{l}</Text>
          ))}
          {docTitle ? (
            <Text style={styles.centerTitle}>{docTitle}</Text>
          ) : null}
        </View>

        {/* Right Column: Specialties List */}
        <View style={styles.rightCol}>
          {uniqueList.length > 0
            ? uniqueList.map((spec, i) => (
                <Text key={i} style={styles.specText}>
                  {spec}
                </Text>
              ))
            : null}
        </View>
      </View>
    </View>
  )
}

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { buildPdfHeader, buildFooterLines, type DoctorInfo, type ClinicInfo, type PdfBranding } from "./header-logic"
import { SharedPdfHeader } from "./shared-header"

const S = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#374151" },
  // Header
  header: { borderBottomWidth: 1, borderBottomColor: "#1e3a5f", paddingBottom: 10, marginBottom: 18 },
  logo: { width: 56, height: 56, objectFit: "contain", marginRight: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  headerTitulo: { fontSize: 15, fontWeight: "bold", color: "#1e3a5f" },
  headerSub: { fontSize: 11, marginTop: 2, color: "#374151" },
  headerLinea: { fontSize: 9, color: "#6b7280", marginTop: 1 },
  // Patient box
  patientBox: {
    backgroundColor: "#f0f4ff",
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  patientField: { minWidth: 100 },
  patientLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase" },
  patientValue: { fontSize: 10, fontWeight: "bold", color: "#1e3a5f", marginTop: 2 },
  // Section heading
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e3a5f",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
    paddingBottom: 4,
    marginBottom: 12,
  },
  // Encounter card
  encCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  encDate: { fontSize: 9, color: "#6b7280", marginBottom: 3 },
  encMotivo: { fontSize: 10, fontWeight: "bold", color: "#1e3a5f", marginBottom: 8 },
  // Sub-section within encounter
  subTitle: { fontSize: 9, fontWeight: "bold", color: "#374151", textTransform: "uppercase", marginBottom: 4 },
  dx: { fontSize: 9, color: "#374151", marginBottom: 2 },
  dxCode: { color: "#6b7280" },
  medRow: { fontSize: 9, color: "#374151", marginBottom: 2 },
  noData: { fontSize: 9, color: "#9ca3af", fontStyle: "italic" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    fontSize: 8,
    color: "#9ca3af",
    flexDirection: "row",
    justifyContent: "space-between",
  },
})

export interface HistoryPdfProps {
  doctor: DoctorInfo
  clinic: ClinicInfo | null
  branding?: PdfBranding
  patient: {
    nombre: string
    apellido: string
    edad: number
    cedula?: string
    sexo: string
    telefono?: string
  }
  fecha: string
  encounters: Array<{
    createdAt: string
    motivo?: string
    diagnoses: { codigoCie10: string; descripcion: string }[]
    medications: {
      nombreGenerico: string
      concentracion: string
      dosis: string
      frecuencia: string
      duracion: string
    }[]
  }>
}

const SEXO: Record<string, string> = { MASCULINO: "Masculino", FEMENINO: "Femenino", OTRO: "Otro" }

export function HistoryPdf({ doctor, clinic, branding, patient, fecha, encounters }: HistoryPdfProps) {
  const hdr = buildPdfHeader(doctor, clinic)

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <SharedPdfHeader doctor={doctor} clinic={clinic} branding={branding} />

        {/* Title */}
        <Text style={[S.sectionTitle, { marginBottom: 14 }]}>
          Historial Clínico Completo
        </Text>

        {/* Patient box */}
        <View style={S.patientBox}>
          <View style={S.patientField}>
            <Text style={S.patientLabel}>Paciente</Text>
            <Text style={S.patientValue}>{patient.nombre} {patient.apellido}</Text>
          </View>
          <View style={S.patientField}>
            <Text style={S.patientLabel}>Edad</Text>
            <Text style={S.patientValue}>{patient.edad} años</Text>
          </View>
          <View style={S.patientField}>
            <Text style={S.patientLabel}>Sexo</Text>
            <Text style={S.patientValue}>{SEXO[patient.sexo] ?? patient.sexo}</Text>
          </View>
          {patient.cedula ? (
            <View style={S.patientField}>
              <Text style={S.patientLabel}>Cédula</Text>
              <Text style={S.patientValue}>{patient.cedula}</Text>
            </View>
          ) : null}
          {patient.telefono ? (
            <View style={S.patientField}>
              <Text style={S.patientLabel}>Teléfono</Text>
              <Text style={S.patientValue}>{patient.telefono}</Text>
            </View>
          ) : null}
          <View style={S.patientField}>
            <Text style={S.patientLabel}>Consultas</Text>
            <Text style={S.patientValue}>{encounters.length}</Text>
          </View>
        </View>

        {/* Encounters */}
        {encounters.length === 0 ? (
          <Text style={S.noData}>Sin consultas registradas.</Text>
        ) : (
          encounters.map((enc, i) => (
            <View key={i} style={S.encCard}>
              <Text style={S.encDate}>
                {new Date(enc.createdAt).toLocaleDateString("es-VE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
              <Text style={S.encMotivo}>
                {enc.motivo || "Consulta general"}
              </Text>

              {/* Diagnoses */}
              {enc.diagnoses.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={S.subTitle}>Diagnósticos</Text>
                  {enc.diagnoses.map((d, j) => (
                    <Text key={j} style={S.dx}>
                      <Text style={S.dxCode}>{d.codigoCie10} — </Text>
                      {d.descripcion}
                    </Text>
                  ))}
                </View>
              )}

              {/* Medications */}
              {enc.medications.length > 0 && (
                <View>
                  <Text style={S.subTitle}>Medicamentos</Text>
                  {enc.medications.map((m, j) => (
                    <Text key={j} style={S.medRow}>
                      • {m.nombreGenerico} {m.concentracion} — {m.dosis} cada {m.frecuencia} por {m.duracion}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        {/* Footer */}
        <View style={S.footer} fixed>
          {buildFooterLines(doctor, clinic).map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
          <Text>Generado el {fecha}</Text>
        </View>
      </Page>
    </Document>
  )
}

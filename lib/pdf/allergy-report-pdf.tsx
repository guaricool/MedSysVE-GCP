import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { SharedPdfHeader } from "./shared-header"
import { FirmaBloque } from "./sello-firma"
import type { DoctorInfo, ClinicInfo, PdfBranding } from "./header-logic"

const S = StyleSheet.create({
  page: { padding: 35, fontSize: 8.5, fontFamily: "Helvetica", color: "#1e293b", backgroundColor: "#ffffff" },
  titleBox: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  docTitle: { fontSize: 12, fontWeight: "bold", color: "#0369a1", textTransform: "uppercase" },
  docSub: { fontSize: 7.5, color: "#0284c7", marginTop: 2 },
  dateBadge: { fontSize: 8.5, fontWeight: "bold", color: "#0c4a6e" },

  patientBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
    backgroundColor: "#f8fafc",
  },
  patientRow: { flexDirection: "row", justifyContent: "space-between" },
  patientLabel: { fontSize: 7.5, color: "#64748b", textTransform: "uppercase" },
  patientVal: { fontSize: 9.5, fontWeight: "bold", color: "#0f172a" },

  categorySection: { marginBottom: 10 },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0284c7",
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 4,
    borderRadius: 3,
  },
  categoryTitle: { fontSize: 9, fontWeight: "bold", color: "#ffffff", textTransform: "uppercase" },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    backgroundColor: "#f1f5f9",
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#334155",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  colSustancia: { flex: 3, fontWeight: "bold", color: "#0f172a" },
  colFuente: { flex: 3, color: "#64748b" },
  colReaccion: { flex: 1.5, textAlign: "center" },

  badgeNeg: { backgroundColor: "#f1f5f9", color: "#64748b", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 2, fontSize: 7.5, fontWeight: "bold" },
  badgePos1: { backgroundColor: "#fef9c3", color: "#854d0e", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 2, fontSize: 7.5, fontWeight: "bold" },
  badgePos2: { backgroundColor: "#ffedd5", color: "#9a3412", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 2, fontSize: 7.5, fontWeight: "bold" },
  badgePos3: { backgroundColor: "#fee2e2", color: "#991b1b", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 2, fontSize: 7.5, fontWeight: "bold" },
  badgeIr: { backgroundColor: "#f3e8ff", color: "#6b21a8", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 2, fontSize: 7.5, fontWeight: "bold" },

  legendBox: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 6,
    marginBottom: 10,
  },
  legendTitle: { fontSize: 7.5, fontWeight: "bold", color: "#334155", marginBottom: 3, textTransform: "uppercase" },
  legendGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  legendItem: { fontSize: 7, color: "#475569" },

  commentBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    borderRadius: 4,
    padding: 6,
    marginBottom: 10,
  },
  commentTitle: { fontSize: 8, fontWeight: "bold", color: "#0369a1", marginBottom: 2 },
  commentText: { fontSize: 8, color: "#334155", lineHeight: 1.3 },

  footerBox: { marginTop: "auto", paddingTop: 8 },
})

export interface PatientAllergyItem {
  id: string
  sustancia: string
  reaccion?: string | null
  categoria?: string | null
  gravedad: "LEVE" | "MODERADA" | "SEVERA"
  activa: boolean
}

export interface PatchItemPdf {
  hapteno: string
  fuente?: string
  resultado: string
}

export interface PrickItemPdf {
  label: string
  category: string
  papuleMm: number
  erythemaMm?: number
}

export interface AllergyReportPdfProps {
  doctor: DoctorInfo
  clinic: ClinicInfo | null
  branding?: PdfBranding
  patient: {
    nombre: string
    cedula?: string
    edad?: number
    genero?: string
  }
  alergias?: PatientAllergyItem[]
  prickTest?: {
    histamineControlMm: number
    salineControlMm: number
    items: PrickItemPdf[]
  }
  patchTest?: {
    fechaAplicacion?: string
    fechaLectura?: string
    diagnostico?: string
    comentarios?: string
    items: PatchItemPdf[]
  }
  fechaEmision: string
}

export function AllergyReportPdf({
  doctor,
  clinic,
  branding,
  patient,
  alergias = [],
  prickTest,
  patchTest,
  fechaEmision,
}: AllergyReportPdfProps) {

  const getPatchBadgeStyle = (res: string) => {
    switch (res) {
      case "Neg":
        return S.badgeNeg
      case "?":
      case "+":
        return S.badgePos1
      case "++":
        return S.badgePos2
      case "+++":
      case "++++":
        return S.badgePos3
      case "IR":
        return S.badgeIr
      default:
        return S.badgeNeg
    }
  }

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <SharedPdfHeader doctor={doctor} clinic={clinic} branding={branding} />

        <View style={S.titleBox}>
          <View>
            <Text style={S.docTitle}>Informe de Alergología Cutánea & Pruebas Inmunológicas</Text>
            <Text style={S.docSub}>Prick Test Cutáneo, Prueba de Parche (Haptenos) & Sensibilización Alergénica</Text>
          </View>
          <Text style={S.dateBadge}>Fecha: {fechaEmision}</Text>
        </View>

        {/* Datos del Paciente */}
        <View style={S.patientBox}>
          <View style={S.patientRow}>
            <View>
              <Text style={S.patientLabel}>Nombre del Paciente</Text>
              <Text style={S.patientVal}>{patient.nombre}</Text>
            </View>
            {patient.cedula && (
              <View>
                <Text style={S.patientLabel}>Cédula / Identificación</Text>
                <Text style={S.patientVal}>{patient.cedula}</Text>
              </View>
            )}
            {patient.edad !== undefined && (
              <View>
                <Text style={S.patientLabel}>Edad</Text>
                <Text style={S.patientVal}>{patient.edad} años</Text>
              </View>
            )}
          </View>
        </View>

        {/* SECTION 1: PRICK TEST CUTÁNEO */}
        {prickTest && (
          <View style={S.categorySection}>
            <View style={S.categoryHeader}>
              <Text style={S.categoryTitle}>Prick Test Cutáneo (Aeroalérgenos y Alimentos)</Text>
              <Text style={{ fontSize: 7.5, color: "#ffffff" }}>
                Histamina: {prickTest.histamineControlMm}mm | Salino: {prickTest.salineControlMm}mm
              </Text>
            </View>

            <View style={S.tableHeader}>
              <Text style={S.colSustancia}>ALÉRGENO / SUSTANCIA</Text>
              <Text style={S.colFuente}>CATEGORÍA</Text>
              <Text style={S.colReaccion}>PÁPULA / ERITEMA</Text>
            </View>

            {prickTest.items.map((item, idx) => (
              <View key={idx} style={S.tableRow}>
                <Text style={S.colSustancia}>{item.label}</Text>
                <Text style={S.colFuente}>{item.category}</Text>
                <View style={S.colReaccion}>
                  <Text style={item.papuleMm >= 3.0 ? S.badgePos2 : S.badgeNeg}>
                    {item.papuleMm}mm {item.erythemaMm ? `/ ${item.erythemaMm}mm` : ""} {item.papuleMm >= 3.0 ? "(+)" : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 2: PRUEBA DE PARCHE / HAPTENOS DE CONTACTO */}
        {patchTest && (
          <View style={S.categorySection}>
            <View style={S.categoryHeader}>
              <Text style={S.categoryTitle}>Prueba de Parche (Patch Test - Alérgenos de Contacto / Haptenos)</Text>
              <Text style={{ fontSize: 7.5, color: "#ffffff" }}>
                {patchTest.fechaAplicacion ? `Aplicación: ${patchTest.fechaAplicacion} | ` : ""}
                {patchTest.fechaLectura ? `Lectura: ${patchTest.fechaLectura}` : ""}
              </Text>
            </View>

            {/* Leyenda Explicativa de las Cruces */}
            <View style={S.legendBox}>
              <Text style={S.legendTitle}>Leyenda de Graduación por Cruces (Escala Internacional ICDRG):</Text>
              <View style={S.legendGrid}>
                <Text style={S.legendItem}>• Neg: Negativo (sin reacción)</Text>
                <Text style={S.legendItem}>• ?: Dudoso (solo eritema tenue)</Text>
                <Text style={S.legendItem}>• +: Débil (eritema y pápulas)</Text>
                <Text style={S.legendItem}>• ++: Moderada (vesículas)</Text>
                <Text style={S.legendItem}>• +++/++++: Fuerte/Extrema (ampollas/quemadura)</Text>
                <Text style={S.legendItem}>• IR: Irritativa (no alérgica)</Text>
              </View>
            </View>

            <View style={S.tableHeader}>
              <Text style={S.colSustancia}>HAPTENO / ALÉRGENO</Text>
              <Text style={S.colFuente}>FUENTE / ORIGEN</Text>
              <Text style={S.colReaccion}>RESULTADO</Text>
            </View>

            {patchTest.items.map((item, idx) => (
              <View key={idx} style={S.tableRow}>
                <Text style={S.colSustancia}>{item.hapteno}</Text>
                <Text style={S.colFuente}>{item.fuente || "Contacto general"}</Text>
                <View style={S.colReaccion}>
                  <Text style={getPatchBadgeStyle(item.resultado)}>{item.resultado}</Text>
                </View>
              </View>
            ))}

            {patchTest.comentarios && (
              <View style={[S.commentBox, { marginTop: 6 }]}>
                <Text style={S.commentTitle}>Conclusión / Comentario del Alergólogo:</Text>
                <Text style={S.commentText}>{patchTest.comentarios}</Text>
              </View>
            )}
          </View>
        )}

        {/* SECTION 3: LISTADO GENERAL DE ALERGIAS REGISTRADAS */}
        {alergias && alergias.length > 0 && !prickTest && !patchTest && (
          <View style={S.categorySection}>
            <View style={S.categoryHeader}>
              <Text style={S.categoryTitle}>Alergias & Sensibilizaciones Confirmadas</Text>
            </View>
            <View style={S.tableHeader}>
              <Text style={S.colSustancia}>SUSTANCIA</Text>
              <Text style={S.colFuente}>REACCIÓN</Text>
              <Text style={S.colReaccion}>GRAVEDAD</Text>
            </View>
            {alergias.map((al) => (
              <View key={al.id} style={S.tableRow}>
                <Text style={S.colSustancia}>{al.sustancia}</Text>
                <Text style={S.colFuente}>{al.reaccion || "No especificada"}</Text>
                <View style={S.colReaccion}>
                  <Text style={al.gravedad === "SEVERA" ? S.badgePos3 : S.badgePos2}>{al.gravedad}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Firma y Sello del Médico */}
        <View style={S.footerBox}>
          <FirmaBloque doctor={doctor} clinic={clinic} branding={branding} disclaimer="Informe médico oficial válido con firma y sello digital MedSysVE" />
        </View>
      </Page>
    </Document>
  )
}

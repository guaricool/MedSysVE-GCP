import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { buildPdfHeader, buildFooterLines, type DoctorInfo, type ClinicInfo, type PdfBranding } from "./header-logic"
import { SharedPdfHeader } from "./shared-header"
import { PreviewWatermark } from "./preview-watermark"

const S = StyleSheet.create({
  page: { padding: 32, fontSize: 9.5, fontFamily: "Helvetica", color: "#374151" },
  patientLine: {
    backgroundColor: "#f0f4ff",
    borderRadius: 4,
    padding: "5 10",
    marginBottom: 10,
  },
  patientLineText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1e3a5f",
    textAlign: "center",
  },
  patientLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase" },
  soapSection: { marginBottom: 10 },
  soapLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#1e3a5f",
    padding: "3 8",
    marginBottom: 6,
  },
  soapText: { fontSize: 10, color: "#374151", lineHeight: 1.4, paddingLeft: 8 },
  subTitle: { fontSize: 9, fontWeight: "bold", color: "#374151", textTransform: "uppercase", marginBottom: 4, marginTop: 8 },
  row: { fontSize: 9, color: "#374151", marginBottom: 2, paddingLeft: 8 },
  rowBold: { fontSize: 9, fontWeight: "bold", color: "#374151", marginBottom: 2, paddingLeft: 8 },
  noData: { fontSize: 9, color: "#9ca3af", fontStyle: "italic", paddingLeft: 8 },
  divider: { borderTopWidth: 1, borderTopColor: "#e5e7eb", marginVertical: 12 },
  signatureBox: {
    marginTop: 45,
    borderTopWidth: 1,
    borderTopColor: "#374151",
    paddingTop: 8,
    width: 200,
    alignSelf: "flex-end",
    textAlign: "center",
    // Fixed height so the sello Image (position: absolute, 80x80)
    // does not escape the box and overlap the borderTop above.
    height: 90,
  },
  signatureText: { fontSize: 9, color: "#374151", textAlign: "center" },
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

export interface EncounterSummaryPdfProps {
  doctor: DoctorInfo
  clinic: ClinicInfo | null
  patient: {
    nombre: string
    apellido: string
    edad: number
    cedula?: string
    sexo: string
    grupoSanguineo?: string
    telefono?: string
  }
  encounter: {
    fecha: string
    motivo?: string
    historiaClinica?: string
    examenFisico?: string
    plan?: string
    vitales?: Record<string, number | null>
    diagnoses: { codigoCie10: string; descripcion: string; tipo: string }[]
    medications: {
      nombreGenerico: string
      concentracion: string
      dosis: string
      frecuencia: string
      duracion: string
      instrucciones?: string
    }[]
    labOrders: { estudios: string[]; urgente: boolean; indicacionesClinicas?: string }[]
    imagingOrders: { tipoImagen: string; region: string; urgente: boolean; indicacionesClinicas?: string }[]
    /**
     * Specialty-specific fields saved by CardiologiaForm, TraumatologiaForm, etc.
     * Rendered in the PDF as a dedicated section when non-empty.
     */
    datosEspecialidad?: Record<string, unknown> | null
  }
  generadoEl: string
  branding?: PdfBranding
  activeSections?: string[]
  omitSello?: boolean
}

const SEXO: Record<string, string> = { MASCULINO: "Masculino", FEMENINO: "Femenino", OTRO: "Otro" }

const VITALES_LABELS: Record<string, string> = {
  taSistolica: "TA Sistólica",
  taDiastolica: "TA Diastólica",
  fc: "FC (lpm)",
  fr: "FR (rpm)",
  temperatura: "Temp (°C)",
  peso: "Peso (kg)",
  talla: "Talla (cm)",
  spo2: "SpO₂ (%)",
  glasgow: "Glasgow",
}

/** Human-readable Spanish labels for specialty form fields — same vocabulary as generate-report.ts */
const SPECIALTY_PDF_LABELS: Record<string, string> = {
  // Cardiología
  ritmo: "Ritmo cardíaco", eje: "Eje eléctrico", prIntervalo: "PR Intervalo (ms)",
  qrsDuracion: "QRS Duración (ms)", qtcIntervalo: "QTc Intervalo (ms)",
  hallazgosEcg: "Hallazgos ECG", nyhaClase: "Clase NYHA", riesgoCardio: "Riesgo cardiovascular",
  // Cirugía General
  tipoHerida: "Tipo de herida", alvaradoAnswers: "Escala de Alvarado", dolorMigratorio: "Dolor migratorio FID",
  anorexia: "Anorexia", nauseas: "Náuseas", dolorFid: "Dolor FID", rebote: "Rebote", fiebre: "Fiebre",
  leucocitosis: "Leucocitosis", desviacionIzq: "Desviación izquierda", dolorEva: "Dolor (EVA)",
  omsListChecked: "Checklist OMS", confirmarIdentidad: "Identidad confirmada", marcarSitio: "Marcación de sitio",
  oximetroPulso: "Oxímetro de pulso", alergiasConocidas: "Alergias conocidas", riesgoAspiracion: "Riesgo de aspiración",
  profilaxisAntibiotica: "Profilaxis antibiótica",
  // Gastroenterología
  bristolType: "Escala Bristol", forrestClass: "Clasificación Forrest", childPugh: "Child-Pugh",
  bilirrubina: "Bilirrubina", albumina: "Albúmina", inr: "INR", encefalopatia: "Encefalopatía",
  ascitis: "Ascitis", sintomas: "Síntomas reportados", mayoScore: "Mayo Score", frecuenciaEvacuacion: "Frecuencia de evacuación",
  sangradoRectal: "Sangrado rectal", hallazgosMucosa: "Hallazgos en mucosa", evaluacionGlobal: "Evaluación global",
  // Anestesiología
  asaClass: "Clasificación ASA", mallampatiClass: "Mallampati", distanciaTiromentoniana: "Dist. Tiromentoniana (cm)",
  viaAereaDificil: "Vía aérea difícil", complicacionesAnestesia: "Complicaciones anestesia", stopBangAnswers: "Test STOP-BANG",
  ronquidos: "Ronquidos fuertes", cansancio: "Cansancio diurno", apnea: "Apnea observada", presionArterial: "Hipertensión",
  imcMayor35: "IMC > 35", edadMayor50: "Edad > 50", cuelloAncho: "Cuello ancho (>40cm)", generoMasculino: "Género masculino",
  // Neurología
  glasgow: "Glasgow", aperturaOcular: "Apertura ocular", respuestaVerbal: "Respuesta verbal", respuestaMotora: "Respuesta motora",
  fuerzaMrc: "Fuerza MRC", msd: "MSD", msi: "MSI", mid: "MID", mii: "MII", reflejos: "Reflejos", bicipital: "Bicipital",
  tricipital: "Tricipital", rotuliano: "Rotuliano", aquileo: "Aquíleo", paresCranealesAlterados: "Pares craneales alterados",
  // Medicina Interna
  wellsAnswers: "Criterios de Wells", charlsonAnswers: "Índice de Charlson", edadDecada: "Década (Edad)",
  creatinina: "Creatinina (mg/dL)", pacienteEdad: "Edad", pacienteSexo: "Sexo", tfgeCalculada: "TFG Estimada",
  trombosisPrevia: "Trombosis previa", cirugiaReciente: "Cirugía reciente", cancerActivo: "Cáncer activo",
  hemoptisis: "Hemoptisis", fcMayor100: "FC > 100", signosTvp: "Signos TVP", dxAlternativoMenosProbable: "Dx alternativo menos prob.",
  // Neumonología
  fev1: "FEV1 (%)", fvc: "FVC (%)", fev1FvcRatio: "FEV1/FVC", spo2: "SpO2 (%)", mmrcDyspnea: "Disnea (mMRC)",
  auscultacionPulmonar: "Auscultación",
  // Pediatría
  percentilPeso: "Percentil Peso", percentilTalla: "Percentil Talla", percentilCefalico: "Percentil Cefálico",
  hitoMotorGrueso: "Motor Grueso", hitoMotorFino: "Motor Fino", hitoLenguaje: "Lenguaje", hitoSocial: "Social",
  vacunasColocadas: "Vacunas Colocadas",
  // Obstetricia
  fum: "FUM", fpp: "FPP", semanasGestacion: "Semanas gestación", fcf: "FCF (lpm)", alturaUterina: "Altura uterina (cm)",
  presentacion: "Presentación", movimientos: "Movimientos fetales", notasObstetricia: "Notas obstétricas",
  // Oncología
  t: "Tumor (T)", n: "Nódulo (N)", m: "Metástasis (M)", estadio: "Estadio Clínico", cicloQuimio: "Ciclo Quimioterapia",
  esquemaQuimio: "Esquema", gradoDiferenciacion: "Grado", notasOncologia: "Notas Oncológicas",
  // Traumatología
  procedimiento: "Procedimiento", lateralidad: "Lateralidad", osteosintesis: "Osteosíntesis", clasificacionAO: "Clasificación AO",
  hallazgosAnatomicos: "Hallazgos anatómicos", zonaAfectada: "Zona afectada", medicionesRx: "Mediciones Rx",
  // Urología
  ipssAnswers: "Síntomas IPSS", ipssQol: "IPSS QoL", psaTotal: "PSA Total (ng/mL)", psaLibre: "PSA Libre (ng/mL)",
  volumenResiduo: "Vol. Residuo (mL)", tactoRectal: "Tacto Rectal", uroQmax: "Uroflujo Qmax", uroQmed: "Uroflujo Qmed",
  uroVol: "Uroflujo Vol.", uroTiempo: "Uroflujo Tiempo", vaciadoIncompleto: "Vaciado incompleto", frecuencia: "Frecuencia",
  intermitencia: "Intermitencia", urgencia: "Urgencia", chorroDebil: "Chorro débil", esfuerzo: "Esfuerzo miccional", nicturia: "Nicturia",
  // Endocrinología
  hba1c: "HbA1c (%)", glucosaAyunas: "Glucosa en ayunas (mg/dL)", insulinaBasal: "Insulina basal (μUI/mL)",
  tsh: "TSH (μUI/mL)", t4Libre: "T4 Libre (ng/dL)", t3Total: "T3 Total (ng/dL)", tipoDiabetes: "Tipo de diabetes",
  tipoTiroides: "Patología tiroidea", puntosMonofilamento: "Puntos monofilamento", pulsoPedio: "Pulso pedio",
  pulsoTibial: "Pulso tibial", colesterolTotal: "Colesterol total", colesterolHdl: "Colesterol HDL",
  // Dermatología
  fitzpatrick: "Fototipo Fitzpatrick", glogau: "Escala Glogau", lesionMorfologia: "Morfología de lesión",
  lesionDistribucion: "Distribución de lesión", lesionColor: "Coloración de lesión", notasDermatologia: "Notas dermatológicas",
}

const SPECIALTY_SIGNATURES_PDF: { name: string; keys: string[] }[] = [
  { name: "Cardiología", keys: ["ritmo", "hallazgosEcg", "nyhaClase"] },
  { name: "Traumatología", keys: ["procedimiento", "osteosintesis", "clasificacionAO"] },
  { name: "Endocrinología", keys: ["hba1c", "tsh", "tipoDiabetes"] },
  { name: "Neurología", keys: ["glasgow", "fuerzaMrc", "reflejos"] },
  { name: "Gastroenterología", keys: ["bristolType", "childPugh", "mayoScore"] },
  { name: "Urología", keys: ["ipssAnswers", "psaTotal", "tactoRectal"] },
  { name: "Pediatría", keys: ["percentilPeso", "hitoMotorGrueso", "vacunasColocadas"] },
  { name: "Anestesiología", keys: ["asaClass", "mallampatiClass", "stopBangAnswers"] },
  { name: "Dermatología", keys: ["fitzpatrick", "glogau", "lesionMorfologia"] },
  { name: "Cirugía General", keys: ["tipoHerida", "alvaradoAnswers", "omsListChecked"] },
  { name: "Medicina Interna", keys: ["wellsAnswers", "charlsonAnswers", "tfgeCalculada"] },
  { name: "Obstetricia", keys: ["fpp", "semanasGestacion", "alturaUterina"] },
  { name: "Neumología", keys: ["fev1FvcRatio", "mmrcDyspnea", "auscultacionPulmonar"] },
  { name: "Oncología", keys: ["t", "n", "m", "estadio", "esquemaQuimio"] },
]

function getSpecialtyRows(datos: Record<string, unknown> | null | undefined): { label: string; value: string }[] {
  if (!datos || typeof datos !== "object") return []
  const rows: { label: string; value: string }[] = []
  
  for (const [key, value] of Object.entries(datos)) {
    if (value === null || value === undefined || value === "") continue

    const label = SPECIALTY_PDF_LABELS[key] ?? key

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        if (value.length === 0) continue
        rows.push({ label, value: value.join(", ") })
      } else {
        const obj = value as Record<string, unknown>
        const keys = Object.keys(obj)
        if (keys.length === 0) continue
        
        const parts = []
        for (const [k, v] of Object.entries(obj)) {
          if (v === false || v === null || v === undefined || v === "") continue
          const subLabel = SPECIALTY_PDF_LABELS[k] ?? k
          parts.push(`${subLabel}${v === true ? "" : `: ${v}`}`)
        }
        
        if (parts.length === 0) continue
        rows.push({ label, value: parts.join(" | ") })
      }
      continue
    }

    rows.push({ label, value: String(value) })
  }
  return rows
}

function getSpecialtyName(datos: Record<string, unknown>): string {
  const keys = new Set(Object.keys(datos))
  for (const sig of SPECIALTY_SIGNATURES_PDF) {
    if (sig.keys.some((k) => keys.has(k))) return sig.name
  }
  return ""
}

export function EncounterSummaryPdf({
  doctor,
  clinic,
  patient,
  encounter,
  generadoEl,
  branding,
  activeSections,
  omitSello,
}: EncounterSummaryPdfProps) {
  const hdr = buildPdfHeader(doctor, clinic)
  const vitalesEntries = encounter.vitales
    ? Object.entries(encounter.vitales).filter(([, v]) => v !== null && v !== undefined)
    : []

  const enabled = activeSections
    ? new Set(activeSections)
    : new Set(["subjetivo", "objetivo", "examen", "analisis", "plan"])

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {omitSello && <PreviewWatermark />}
        {/* Header */}
        <SharedPdfHeader doctor={doctor} clinic={clinic} branding={branding} docTitle="Informe Médico" />

        {/* Patient Line */}
        <View style={S.patientLine}>
          <Text style={S.patientLineText}>
            Paciente: {patient.nombre} {patient.apellido}   ·   
            {patient.cedula ? `C.I.: ${patient.cedula}   ·   ` : ""}
            Edad: {patient.edad} años   ·   
            Sexo: {SEXO[patient.sexo] ?? patient.sexo}   ·   
            {patient.grupoSanguineo ? `Gr. Sanguíneo: ${patient.grupoSanguineo}   ·   ` : ""}
            {patient.telefono ? `Tel: ${patient.telefono}   ·   ` : ""}
            Fecha: {encounter.fecha}
          </Text>
        </View>

        {/* Motivo de Consulta */}
        {enabled.has("subjetivo") && encounter.motivo ? (
          <View style={S.soapSection}>
            <Text style={S.soapLabel}>MOTIVO DE CONSULTA</Text>
            <Text style={S.soapText}>{encounter.motivo}</Text>
          </View>
        ) : null}

        {/* Enfermedad Actual */}
        {enabled.has("subjetivo") && encounter.historiaClinica ? (
          <View style={S.soapSection}>
            <Text style={S.soapLabel}>ENFERMEDAD ACTUAL</Text>
            <Text style={S.soapText}>{encounter.historiaClinica}</Text>
          </View>
        ) : null}

        {/* O — Objetivo (vitales) */}
        {enabled.has("objetivo") && vitalesEntries.length > 0 ? (
          <View style={S.soapSection}>
            <Text style={S.soapLabel}>O — OBJETIVO (SIGNOS VITALES)</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingLeft: 8 }}>
              {vitalesEntries.map(([k, v]) => (
                <View key={k} style={{ minWidth: 80, marginBottom: 6 }}>
                  <Text style={S.patientLabel}>{VITALES_LABELS[k] ?? k}</Text>
                  <Text style={{ fontSize: 11, fontWeight: "bold", color: "#1e3a5f" }}>
                    {String(v)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* O — Examen Físico */}
        {enabled.has("examen") && encounter.examenFisico ? (
          <View style={S.soapSection}>
            <Text style={S.soapLabel}>EXAMEN FÍSICO</Text>
            <Text style={S.soapText}>{encounter.examenFisico}</Text>
          </View>
        ) : null}

        {/* A — Diagnósticos */}
        {enabled.has("analisis") && encounter.diagnoses.length > 0 ? (
          <View style={S.soapSection}>
            <Text style={S.soapLabel}>DIAGNÓSTICOS</Text>
            {encounter.diagnoses.map((d, i) => {
              const showCode = d.codigoCie10 && d.codigoCie10 !== "S/C"
              return (
                <Text key={i} style={S.row}>
                  {i + 1}.- {showCode ? `${d.codigoCie10} — ` : ""}{d.descripcion}
                  {d.tipo === "SECUNDARIO" ? "  (secundario)" : ""}
                </Text>
              )
            })}
          </View>
        ) : null}

        {/* P — Plan */}
        {enabled.has("plan") && encounter.plan ? (
          <View style={S.soapSection}>
            <Text style={S.soapLabel}>PLAN</Text>
            <Text style={S.soapText}>{encounter.plan}</Text>
          </View>
        ) : null}

        {/* Medications */}
        {enabled.has("receta") && encounter.medications.length > 0 ? (
          <View style={S.soapSection}>
            <Text style={S.soapLabel}>MEDICAMENTOS PRESCRITOS</Text>
            {encounter.medications.map((m, i) => (
              <View key={i} style={{ marginBottom: 6, paddingLeft: 8 }}>
                <Text style={S.rowBold}>
                  {i + 1}. {m.nombreGenerico} {m.concentracion}
                </Text>
                <Text style={S.row}>   {m.dosis} — cada {m.frecuencia} por {m.duracion}</Text>
                {m.instrucciones ? (
                  <Text style={S.row}>   Instrucciones: {m.instrucciones}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Lab orders */}
        {enabled.has("lab-order") && encounter.labOrders.length > 0 ? (
          <View style={S.soapSection}>
            <Text style={S.soapLabel}>ÓRDENES DE LABORATORIO</Text>
            {encounter.labOrders.map((lo, i) => (
              <View key={i} style={{ marginBottom: 4, paddingLeft: 8 }}>
                <Text style={S.row}>
                  {lo.urgente ? "[URGENTE] " : ""}
                  {lo.estudios.join(", ")}
                </Text>
                {lo.indicacionesClinicas ? (
                  <Text style={S.row}>   Indicaciones: {lo.indicacionesClinicas}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Imaging orders */}
        {enabled.has("imaging") && encounter.imagingOrders.length > 0 ? (
          <View style={S.soapSection}>
            <Text style={S.soapLabel}>ÓRDENES DE IMÁGENES</Text>
            {encounter.imagingOrders.map((io, i) => (
              <View key={i} style={{ marginBottom: 4, paddingLeft: 8 }}>
                <Text style={S.row}>
                  {io.urgente ? "[URGENTE] " : ""}
                  {io.tipoImagen} — {io.region}
                </Text>
                {io.indicacionesClinicas ? (
                  <Text style={S.row}>   Indicaciones: {io.indicacionesClinicas}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Datos de Especialidad — always shown when present, not gated by activeSections */}
        {(() => {
          const rows = getSpecialtyRows(encounter.datosEspecialidad)
          if (rows.length === 0) return null
          const name = getSpecialtyName(encounter.datosEspecialidad!)
          const title = name ? `DATOS DE ESPECIALIDAD (${name})` : "DATOS DE ESPECIALIDAD"
          return (
            <View style={S.soapSection}>
              <Text style={S.soapLabel}>{title}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingLeft: 8 }}>
                {rows.map((row, i) => (
                  <View key={i} style={{ minWidth: 100, marginBottom: 6 }}>
                    <Text style={S.patientLabel}>{row.label}</Text>
                    <Text style={{ fontSize: 10, fontWeight: "bold", color: "#1e3a5f" }}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )
        })()}

        {/* Signature */}
        {!omitSello ? (
          <View style={S.signatureBox}>
            {branding?.selloPath && (
              <Image
                src={branding.selloPath}
                // Positioned above the line (which is the top border of signatureBox).
                // Since the signatureBox has borderTopWidth: 1, top: -85 places
                // the 80x80 sello exactly above the line.
                style={{ position: "absolute", top: -85, left: 60, width: 80, height: 80, objectFit: "contain", opacity: 0.85 }}
              />
            )}
            <Text style={S.signatureText}>{doctor.nombre}</Text>
            {doctor.especialidad ? (
              <Text style={S.signatureText}>{doctor.especialidad}</Text>
            ) : null}
            {doctor.cedula ? (
              <Text style={S.signatureText}>C.M. {doctor.cedula}</Text>
            ) : null}
          </View>
        ) : (
          <View style={{ marginTop: 45, paddingTop: 8, width: 200, alignSelf: "flex-end" }}>
            <Text style={{ fontSize: 9, color: "#92400e", fontStyle: "italic", fontWeight: "bold", textAlign: "right" }}>
              — Vista previa —
            </Text>
            <Text style={{ fontSize: 9, color: "#92400e", fontStyle: "italic", fontWeight: "bold", textAlign: "right" }}>
              sin validez legal sin firma y sello
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text>Generado el {generadoEl}</Text>
          <View style={{ flexDirection: "column", alignItems: "flex-end" }}>
            {buildFooterLines(doctor, clinic).map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  )
}

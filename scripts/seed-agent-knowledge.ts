import { upsertKnowledgeChunk } from "../lib/ai/rag-engine"
import { ensureDbSchema } from "../lib/db"

const KNOWLEDGE_ITEMS = [
  // -------------------------------------------------------------------------
  // MARKETING
  // -------------------------------------------------------------------------
  {
    source: "SISTEMA.md",
    category: "MARKETING" as const,
    title: "Resumen de MedSysVE - Historia Clínica Electrónica para Venezuela",
    content: `MedSysVE es la plataforma SaaS de Historia Clínica Electrónica (HCE) diseñada especialmente para médicos en Venezuela. 
Incluye:
- 27 especialidades médicas con plantillas personalizadas (Alergología, Cardiología, Pediatría, Traumatología, Gineco-Obstetricia, etc.).
- Facturación Dual USD / Bolívares convertidos automáticamente a la tasa oficial publicada por el Banco Central de Venezuela (BCV).
- Transcripción asistida por Inteligencia Artificial en tiempo real (Gemini Spark Ambient Clinical Scribe) que llena los campos SOAP sin que el médico tenga que escribir durante la consulta.
- Emisión de Recetas y Répes digitales con código QR de verificación de autenticidad.
- Portal de Pacientes para consulta de informes, resultados de laboratorio e historial.
- Red de Referidos Médicos para interconsultas entre doctores registrados por estado y ciudad.`,
  },
  {
    source: "PRICING.md",
    category: "MARKETING" as const,
    title: "Planes y Precios de Suscripción MedSysVE",
    content: `MedSysVE ofrece planes flexibles adaptados a la práctica médica venezolana:
- Plan Solo / Consultorio Individual: Incluye acceso total a la HCE, recetas con QR, facturación dual BCV y soporte.
- Plan Clínicas / Multiconsultorio: Permite asociar múltiples médicos, secretarias y enfermeras con control de roles y permisos.
- Métodos de pago aceptados: Pago Móvil, Transferencia Bancaria en Bolívares (tasa BCV), Zelle y Tarjetas internacionales vía Stripe.
- Prueba gratuita disponible para médicos registrados con verificación SACS/MPPS.`,
  },

  // -------------------------------------------------------------------------
  // CUSTOMER SERVICE & AGENDAMIENTO
  // -------------------------------------------------------------------------
  {
    source: "APPOINTMENT_GUIDE.md",
    category: "CUSTOMER_SERVICE" as const,
    title: "Guía de Agendamiento de Citas Médicas",
    content: `Los pacientes pueden agendar citas médicas fácilmente:
1. El paciente selecciona a su doctor tratante o busca por especialidad/ubicación (Estado y Ciudad).
2. El sistema muestra los bloques de horarios disponibles (días y horas libres) según la configuración del doctor.
3. El paciente confirma el horario deseado y escribe el motivo de la consulta.
4. La cita queda registrada instantáneamente en la agenda del médico (/agenda).
5. Se envía confirmación por WhatsApp y correo electrónico con opción a recordar 24h antes.`,
  },
  {
    source: "PATIENT_PORTAL.md",
    category: "CUSTOMER_SERVICE" as const,
    title: "Funcionalidades del Portal de Pacientes",
    content: `En el Portal de Pacientes (portal.medsysve.com), el paciente puede:
- Ver y descargar sus recetas médicas en formato PDF oficial con código QR.
- Consultar sus órdenes de laboratorio e informes de estudios radiológicos (DICOM viewer).
- Solicitar y reagendar citas médicas con sus doctores de cabecera.
- Descargar constancias médicas y justificantes autorizados.`,
  },

  // -------------------------------------------------------------------------
  // TECH SUPPORT
  // -------------------------------------------------------------------------
  {
    source: "TECH_FAQ.md",
    category: "TECH_SUPPORT" as const,
    title: "Resolución de Problemas Frecuentes y Soporte Técnico",
    content: `Soporte Técnico de MedSysVE:
- Facturación Dual BCV: La tasa se actualiza diariamente de forma automática desde la API oficial del Banco Central de Venezuela. Si la tasa cambia a medianoche, el sistema reajusta los montos en Bs manteniendo el equivalente acordado en USD.
- Firma Digital y Matrícula MPPS: El médico puede registrar su número de matrícula MPPS y subir su firma digital en Configuración del Workspace para que aparezcan en los PDFs impresos.
- Descarga de Recetas PDF: Todos los PDFs se generan en tiempo real bajo demanda y no almacenan archivos en disco local, protegiendo la privacidad HIPAA/LOPDP.
- Restablecimiento de Contraseña: Si un doctor o paciente olvida su contraseña, puede usar el enlace "¿Olvidaste tu contraseña?" en el login para recibir un enlace de recuperación seguro por correo.`,
  },
  {
    source: "CLINIC_JOIN.md",
    category: "TECH_SUPPORT" as const,
    title: "Códigos de Invitación y Gestión de Clínicas Multi-ciudad",
    content: `Para unir un doctor o consultorio a una clínica existente:
1. El propietario de la clínica genera un código de invitación único (formato CLINIC-XXXXXX) en la sección Configuración del Workspace.
2. El nuevo médico ingresa dicho código en su panel o durante el registro.
3. Al unirse, la ubicación (Estado y Ciudad) del consultorio se sincroniza automáticamente para la red de referidos interconsultas.`,
  },
]

export async function seedKnowledgeBase() {
  console.log("[SeedKnowledge] Asegurando esquema de base de datos...")
  await ensureDbSchema()

  console.log("[SeedKnowledge] Indexando bloques de conocimiento para los agentes...")
  for (const item of KNOWLEDGE_ITEMS) {
    console.log(` -> Indexando: [${item.category}] ${item.title}`)
    await upsertKnowledgeChunk(item)
  }

  console.log("✅ [SeedKnowledge] Base de conocimiento sembrada con éxito.")
}

if (require.main === module) {
  seedKnowledgeBase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error sembrando conocimiento:", err)
      process.exit(1)
    })
}

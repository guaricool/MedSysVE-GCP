import { GoogleGenAI, Type, Tool } from "@google/genai"
import { db } from "@/lib/db"
import { sendWhatsAppTextMessage } from "@/lib/whatsapp"
import { sendMetaDirectMessage } from "@/lib/meta-messaging"
import { searchKnowledgeBase } from "@/lib/ai/rag-engine"

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
})

export type BotType = "MARKETING" | "CUSTOMER_SERVICE" | "TECH_SUPPORT"
export type ChannelType = "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "WEB"

const DEFAULT_PROMPTS: Record<BotType, string> = {
  MARKETING: `Eres el Bot Oficial de Ventas y Marketing de MedSysVE (SaaS de Historia Clínica Electrónica para médicos en Venezuela).
Tu objetivo es atender amablemente a los médicos interesados, explicar los beneficios de la plataforma:
- 27 especialidades médicas con formularios adaptados.
- Transcripción asistida por Inteligencia Artificial en tiempo real (Gemini Spark Ambient Clinical Scribe).
- Facturación Dual USD / Bolívares convertidos a la tasa oficial del Banco Central de Venezuela (BCV).
- Recetas y récipes digitales con código QR de verificación de autenticidad.
- Portal de Pacientes e Historias Clínicas en formato estándar SOAP.
Cuando el médico solicite una demo o información de registro, usa la herramienta 'create_lead' para registrar su nombre, teléfono y especialidad.
Debes ser siempre muy respetuoso, profesional, usar español de Venezuela refinado ("Estimado/a Doctor/a") y responder con concisión.`,

  CUSTOMER_SERVICE: `Eres la Asistente Virtual 24/7 de Atención al Paciente de la clínica/médico en MedSysVE.
Tu objetivo es responder dudas sobre horarios de atención del consultorio, requisitos previos (llegada 10 min antes, exámenes previos) y AGENDAR CITAS MÉDICAS en tiempo real.
Instrucciones para agendar citas:
1. Usa la herramienta 'getAvailableDoctorSlots' para consultar disponibilidad en la agenda en tiempo real.
2. Presenta las opciones de forma conversacional (ej: "El Dr. tiene disponibilidad este Jueves a las 9:00 AM y 10:30 AM. ¿Cuál prefieres?").
3. Una vez el paciente elija un horario y provea su nombre y teléfono, utiliza la herramienta 'createAppointment' para agendar formalmente la cita.
Mantén un trato cálido, respetuoso y empático. Nunca des diagnósticos ni prescripciones médicas.`,

  TECH_SUPPORT: `Eres el Bot de Soporte Técnico Autónomo RAG de MedSysVE para médicos y secretarias registrados.
Tu objetivo es diagnosticar y resolver problemas operativos sobre el sistema:
- Firma digital y matrícula MPPS.
- Tasa BCV oficial automática.
- Importación de pacientes y visor DICOM radiológico.
- Restablecimiento de contraseña y código de invitación a clínicas (formato CLINIC-XXXXXX).
Basate en la información RAG provista. Sé claro, directo y estructurado.
Si el usuario solicita hablar con una persona o presenta un problema crítico, usa la herramienta 'escalate_to_human' para transferir el control a un humano.`,
}

// Herramientas declaradas para Gemini 2.0 Flash
const BOT_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "create_lead",
        description: "Registra a un médico interesado (lead de marketing) que solicita demo o registro.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nombre del doctor o profesional de la salud" },
            phone: { type: Type.STRING, description: "Teléfono o canal de contacto" },
            specialty: { type: Type.STRING, description: "Especialidad médica (ej: Pediatría, Cardiología)" },
            notes: { type: Type.STRING, description: "Notas sobre la consulta o intereses expresados" },
          },
          required: ["name", "phone"],
        },
      },
      {
        name: "getAvailableDoctorSlots",
        description: "Consulta en tiempo real la disponibilidad de citas en la base de datos PostgreSQL.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            workspaceId: { type: Type.STRING, description: "ID opcional del workspace o consultorio" },
          },
        },
      },
      {
        name: "createAppointment",
        description: "Agenda una cita médica en tiempo real verificando no sobreocupar el espacio (Overbooking Guard).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            patientName: { type: Type.STRING, description: "Nombre completo del paciente" },
            patientPhone: { type: Type.STRING, description: "Número de teléfono de contacto" },
            patientEmail: { type: Type.STRING, description: "Correo electrónico del paciente (opcional)" },
            dateStr: { type: Type.STRING, description: "Fecha de la cita en formato YYYY-MM-DD" },
            timeStr: { type: Type.STRING, description: "Hora de la cita en formato HH:MM (ej: 09:00, 10:30, 14:00)" },
            motivo: { type: Type.STRING, description: "Motivo de la consulta" },
            workspaceId: { type: Type.STRING, description: "ID opcional del workspace" },
          },
          required: ["patientName", "patientPhone", "dateStr", "timeStr"],
        },
      },
      {
        name: "escalate_to_human",
        description: "Cambia el estado de la conversación a HUMAN_TAKEOVER y notifica al equipo de soporte humano.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            reason: { type: Type.STRING, description: "Motivo de la transferencia a agente humano" },
          },
          required: ["reason"],
        },
      },
    ],
  },
]

// Handlers de herramientas
async function handleCreateLead(opts: { name?: string; phone?: string; specialty?: string; notes?: string; channel: string }) {
  const prisma = db as any
  try {
    const lead = await prisma.botLead.create({
      data: {
        name: opts.name || "Doctor Interesado",
        phone: opts.phone || "Sin teléfono",
        specialty: opts.specialty || "No especificada",
        channel: opts.channel,
        status: "NEW",
        notes: opts.notes || "Registrado mediante Agente de Marketing",
      },
    })
    return { success: true, leadId: lead.id, message: "Lead de médico capturado y registrado exitosamente." }
  } catch (err) {
    console.error("[BotEngine] Error creando lead:", err)
    return { success: false, error: "No se pudo registrar el lead en la base de datos." }
  }
}

async function handleGetAvailableDoctorSlots(workspaceId?: string): Promise<string> {
  const prisma = db as any
  try {
    const targetWorkspace = workspaceId 
      ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
      : await prisma.workspace.findFirst()

    if (!targetWorkspace) {
      return "Consultorio estándar. Días de atención: Lunes a Viernes. Horarios libres: 9:00 AM, 10:30 AM, 2:00 PM, 3:30 PM."
    }

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + 7)

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        workspaceId: targetWorkspace.id,
        fechaHora: { gte: today, lte: futureDate },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { fechaHora: true },
    })

    const occupiedTimes = existingAppointments.map((a: { fechaHora: Date }) => a.fechaHora.toISOString())

    return `Consultorio: ${targetWorkspace.nombre}. Días laborables: Lunes a Viernes. Bloques de atención: 09:00 AM, 10:30 AM, 02:00 PM, 03:30 PM. (Ocupados en próximos 7 días: ${occupiedTimes.length > 0 ? occupiedTimes.length + " citas" : "Ninguno"}).`
  } catch (err) {
    console.warn("[BotEngine] Error consultando disponibilidad de doctor:", err)
    return "Horarios habituales del consultorio: Lunes a Viernes de 8:30 AM a 4:30 PM."
  }
}

async function handleCreateAppointment(opts: {
  patientName: string
  patientPhone: string
  patientEmail?: string
  dateStr: string
  timeStr: string
  motivo?: string
  workspaceId?: string
}) {
  const prisma = db as any
  try {
    const targetWorkspace = opts.workspaceId 
      ? await prisma.workspace.findUnique({ where: { id: opts.workspaceId } })
      : await prisma.workspace.findFirst()

    if (!targetWorkspace) {
      return { success: false, error: "No se encontró un consultorio activo para procesar la reserva." }
    }

    const dateTimeIso = `${opts.dateStr}T${opts.timeStr}:00`
    const appointmentDate = new Date(dateTimeIso)

    if (isNaN(appointmentDate.getTime())) {
      return { success: false, error: "La fecha u hora proporcionada es inválida." }
    }

    // Overbooking Guard: Verificación estricta de solapamiento de horarios
    const existing = await prisma.appointment.findFirst({
      where: {
        workspaceId: targetWorkspace.id,
        fechaHora: appointmentDate,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    })

    if (existing) {
      return {
        success: false,
        error: `El horario de las ${opts.timeStr} del ${opts.dateStr} ya fue reservado por otro paciente. Por favor selecciona otro bloque libre.`,
      }
    }

    // Creación de cita en PostgreSQL
    const appt = await prisma.appointment.create({
      data: {
        workspaceId: targetWorkspace.id,
        titulo: `Cita 24/7 - ${opts.patientName}`,
        tipo: "CONSULTA",
        fechaHora: appointmentDate,
        duracionMinutos: 30,
        notas: `Agendado vía Bot 24/7 (${opts.patientPhone}). Motivo: ${opts.motivo || "Consulta médica general"}.`,
        status: "SCHEDULED",
      },
    })

    // Email de notificación si el paciente provee correo
    if (opts.patientEmail) {
      try {
        const { sendAppointmentCreated } = await import("@/lib/email")
        void sendAppointmentCreated({
          to: opts.patientEmail,
          patientName: opts.patientName,
          fechaHora: `${opts.dateStr} a las ${opts.timeStr}`,
          doctorName: targetWorkspace.nombre,
        })
      } catch (e) {
        console.warn("[BotEngine] Email de cita no enviado:", e)
      }
    }

    return {
      success: true,
      appointmentId: appt.id,
      message: `Cita confirmada exitosamente para ${opts.patientName} el día ${opts.dateStr} a las ${opts.timeStr}.`,
    }
  } catch (err) {
    console.error("[BotEngine] Error agendando cita:", err)
    return { success: false, error: "Error de servidor al guardar la cita." }
  }
}

async function handleEscalateToHuman(conversationId: string, channel: string, senderId: string, reason: string) {
  const prisma = db as any
  try {
    await prisma.botConversation.update({
      where: { id: conversationId },
      data: { status: "HUMAN_TAKEOVER" },
    })

    // Enviar correo de notificación a soporte humano
    try {
      const { sendEmail } = await import("@/lib/email")
      const supportEmail = process.env.MAIL_REPLY_TO || "admin@medsysve.com"
      await sendEmail({
        to: supportEmail,
        subject: `[HUMAN TAKEOVER] Solicitud de Soporte Humano — ${channel}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>⚠️ Solicitud de Atención Humana en Agente Bot</h2>
            <p><strong>Canal:</strong> ${channel}</p>
            <p><strong>ID Usuario:</strong> ${senderId}</p>
            <p><strong>Razón:</strong> ${reason}</p>
            <p>El bot ha cambiado el estado de la conversación a <strong>HUMAN_TAKEOVER</strong> y ha pausado las respuestas automáticas.</p>
          </div>
        `,
      })
    } catch (err) {
      console.warn("[BotEngine] Error enviando correo de escala a humano:", err)
    }

    return { success: true, message: "Conversación transferida a soporte humano exitosamente." }
  } catch (err) {
    console.error("[BotEngine] Error en traspaso a humano:", err)
    return { success: false, error: "Error actualizando estado de conversación." }
  }
}

export async function processIncomingMessage(opts: {
  channel: ChannelType
  senderId: string
  senderName?: string
  text: string
  botType?: BotType
  workspaceId?: string
}) {
  const botType = opts.botType || "MARKETING"
  const channel = opts.channel || "WHATSAPP"

  try {
    const prisma = db as any

    // 1. Obtener o crear conversación
    let conversation = await prisma.botConversation.findFirst({
      where: {
        channel,
        senderId: opts.senderId,
        botType,
      },
    })

    if (!conversation) {
      conversation = await prisma.botConversation.create({
        data: {
          channel,
          senderId: opts.senderId,
          senderName: opts.senderName,
          botType,
          workspaceId: opts.workspaceId || null,
          status: "ACTIVE",
        },
      })
    }

    // 2. Registrar el mensaje entrante del usuario
    await prisma.botMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: opts.text,
      },
    })

    // 3. Si el estado es HUMAN_TAKEOVER, no responder automáticamente
    if (conversation.status === "HUMAN_TAKEOVER") {
      console.log(`[BotEngine] Conversación ${conversation.id} está en control humano. Omitiendo respuesta IA.`)
      return { success: true, handledByHuman: true }
    }

    // 4. Búsqueda vectorial RAG
    const ragResults = await searchKnowledgeBase({
      query: opts.text,
      category: botType,
      limit: 3,
    })

    const ragContext = ragResults.length > 0
      ? `BASE DE CONOCIMIENTO SEMÁNTICA (RAG):\n` +
        ragResults.map((r) => `--- [${r.title}] ---\n${r.content}`).join("\n\n")
      : ""

    // 5. Cargar disponibilidad de citas para Customer Service
    let appointmentContext = ""
    if (botType === "CUSTOMER_SERVICE" || opts.text.toLowerCase().includes("cita") || opts.text.toLowerCase().includes("horario")) {
      appointmentContext = await handleGetAvailableDoctorSlots(opts.workspaceId)
    }

    // 6. Verificación directa de solicitud de soporte humano
    if (opts.text.toLowerCase().includes("agente humano") || opts.text.toLowerCase().includes("hablar con una persona")) {
      await handleEscalateToHuman(conversation.id, channel, opts.senderId, opts.text)
      const takeoverMsg = "Entendido. He notificado a nuestro equipo de soporte humano para que atienda tu consulta personalmente a la brevedad."
      await prisma.botMessage.create({
        data: { conversationId: conversation.id, role: "assistant", content: takeoverMsg },
      })
      if (channel === "WHATSAPP") {
        await sendWhatsAppTextMessage(opts.senderId, takeoverMsg)
      } else if (channel === "INSTAGRAM" || channel === "FACEBOOK") {
        await sendMetaDirectMessage({ recipientId: opts.senderId, text: takeoverMsg, channel })
      }
      return { success: true, response: takeoverMsg, status: "HUMAN_TAKEOVER" }
    }

    // 7. Cargar prompt de sistema
    const customConfig = await prisma.botConfig.findFirst({
      where: {
        workspaceId: opts.workspaceId || null,
        botType,
      },
    })
    const systemPrompt = customConfig?.systemPrompt || DEFAULT_PROMPTS[botType]

    // 8. Cargar historial de conversación
    const recentMessages = await prisma.botMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    recentMessages.reverse()

    const conversationHistory = recentMessages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
      .join("\n")

    // 9. Armar prompt completo
    const fullPrompt = `${systemPrompt}

${ragContext ? `${ragContext}\n\n` : ""}${appointmentContext ? `DISPONIBILIDAD DE CITAS EN TIEMPO REAL:\n${appointmentContext}\n\n` : ""}HISTORIAL DE CONVERSACIÓN:
${conversationHistory}

Responde al usuario amablemente. Si requiere ejecutar acciones como agendar cita, capturar lead o escalar a humano, usa las herramientas provistas.`

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    let aiResponseText = "Gracias por escribir a MedSysVE. Un representante te atenderá a la brevedad."

    if (apiKey) {
      // Invocación a Gemini 2.0 Flash con Tools
      let response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: fullPrompt,
        config: {
          tools: BOT_TOOLS,
        },
      })

      // Manejo de llamadas a herramientas (Tool Calls)
      const functionCalls = response.functionCalls || []
      if (functionCalls.length > 0) {
        for (const call of functionCalls) {
          const args = call.args as Record<string, any>
          if (call.name === "create_lead") {
            await handleCreateLead({
              name: args.name,
              phone: args.phone || opts.senderId,
              specialty: args.specialty,
              notes: args.notes || opts.text,
              channel,
            })
          } else if (call.name === "createAppointment") {
            const result = await handleCreateAppointment({
              patientName: String(args.patientName || ""),
              patientPhone: String(args.patientPhone || opts.senderId),
              patientEmail: args.patientEmail ? String(args.patientEmail) : undefined,
              dateStr: String(args.dateStr || ""),
              timeStr: String(args.timeStr || ""),
              motivo: args.motivo ? String(args.motivo) : undefined,
              workspaceId: opts.workspaceId,
            })
            if (result.success && result.message) {
              aiResponseText = result.message
            } else if (result.error) {
              aiResponseText = result.error
            }
          } else if (call.name === "escalate_to_human") {
            await handleEscalateToHuman(conversation.id, channel, opts.senderId, args.reason || opts.text)
            aiResponseText = "He notificado a nuestro equipo de soporte humano. Un representante se pondrá en contacto contigo a la brevedad."
          } else if (call.name === "getAvailableDoctorSlots") {
            const slots = await handleGetAvailableDoctorSlots(opts.workspaceId)
            aiResponseText = `Nuestros horarios de atención son los siguientes:\n${slots}`
          }
        }
      } else if (response.text) {
        aiResponseText = response.text.trim()
      }
    }

    // 10. Auto-lead fallback si es Marketing y menciona palabras clave
    if (botType === "MARKETING" && (opts.text.toLowerCase().includes("demo") || opts.text.toLowerCase().includes("precio") || opts.text.toLowerCase().includes("registrar"))) {
      await handleCreateLead({
        name: opts.senderName || "Doctor Interesado",
        phone: opts.senderId,
        channel,
        notes: `Interés registrado por consulta: "${opts.text}"`,
      })
    }

    // 11. Guardar la respuesta del asistente en BD
    await prisma.botMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponseText,
      },
    })

    // 12. Actualizar última interacción
    await prisma.botConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    })

    // 13. Enviar respuesta por el canal correspondiente
    if (channel === "WHATSAPP") {
      await sendWhatsAppTextMessage(opts.senderId, aiResponseText)
    } else if (channel === "INSTAGRAM" || channel === "FACEBOOK") {
      await sendMetaDirectMessage({
        recipientId: opts.senderId,
        text: aiResponseText,
        channel,
      })
    }

    return { success: true, response: aiResponseText }
  } catch (error) {
    console.error("[BotEngine] Error al procesar mensaje entrante:", error)
    return { success: false, error: String(error) }
  }
}


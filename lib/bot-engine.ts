import { GoogleGenAI } from "@google/genai"
import { db } from "@/lib/db"
import { sendWhatsAppTextMessage } from "@/lib/whatsapp"

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
})

export type BotType = "MARKETING" | "CUSTOMER_SERVICE" | "TECH_SUPPORT"
export type ChannelType = "WHATSAPP" | "INSTAGRAM" | "FACEBOOK"

const DEFAULT_PROMPTS: Record<BotType, string> = {
  MARKETING: `Eres el Bot Oficial de Ventas y Marketing de MedSysVE (SaaS de Historia Clínica Electrónica para médicos en Venezuela).
Tu objetivo es atender amablemente a los médicos interesados, explicar los beneficios de la plataforma (módulos clínicos por especialidad, recetas con QR, facturación dual USD/Bs a tasa oficial BCV, portal de pacientes, transcripción con IA en tiempo real) y guiarlos a registrarse o agendar una demo.
Debes ser siempre muy respetuoso, profesional, usar español de Venezuela refinado ("Estimado/a Doctor/a") y responder con concisión.`,

  CUSTOMER_SERVICE: `Eres el Asistente Virtual de Atención al Paciente de la clínica/médico en MedSysVE.
Tu objetivo es responder dudas sobre horarios de atención, especialidades, ubicación del consultorio y ayudar a agendar o confirmar citas médicas.
Mantén un trato cálido, respetuoso y empático. Nunca des diagnósticos ni prescripciones médicas.`,

  TECH_SUPPORT: `Eres el Bot de Soporte Técnico de MedSysVE para médicos y secretarias registrados.
Tu objetivo es ayudar a los usuarios a resolver dudas operativas sobre el sistema (ej. cómo crear recetas, emitir facturas duales, restablecer contraseñas o configurar la firma digital).
Sé claro, directo, estructurado y ofrece pasos breves para guiarlos. Si el problema es crítico o desconocido, indica que elevarás la solicitud a un agente humano de soporte.`,
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

    // 4. Cargar la configuración y prompt base
    const customConfig = await prisma.botConfig.findFirst({
      where: {
        workspaceId: opts.workspaceId || null,
        botType,
      },
    })

    const systemPrompt = customConfig?.systemPrompt || DEFAULT_PROMPTS[botType]

    // 5. Cargar historial de últimos 10 mensajes para contexto
    const recentMessages = await prisma.botMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    recentMessages.reverse()


    // 6. Generar respuesta con Gemini 2.0 Flash
    const conversationHistory = recentMessages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
      .join("\n")


    const fullPrompt = `${systemPrompt}\n\nHistorial de Conversación Reciente:\n${conversationHistory}\n\nResponde al último mensaje de forma breve, amable y estructurada.`

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    let aiResponseText = "Gracias por escribirnos. Un representante atenderá tu consulta a la brevedad."

    if (apiKey) {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: fullPrompt,
      })
      if (response.text) {
        aiResponseText = response.text.trim()
      }
    }

    // 7. Guardar la respuesta del asistente en BD
    await prisma.botMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponseText,
      },
    })

    // 8. Actualizar fecha de último mensaje
    await prisma.botConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    })


    // 9. Enviar respuesta según el canal
    if (channel === "WHATSAPP") {
      await sendWhatsAppTextMessage(opts.senderId, aiResponseText)
    }

    return { success: true, response: aiResponseText }
  } catch (error) {
    console.error("[BotEngine] Error al procesar mensaje entrante:", error)
    return { success: false, error: String(error) }
  }
}

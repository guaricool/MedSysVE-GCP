import { NextResponse } from "next/server"
import { processIncomingMessage } from "@/lib/bot-engine"

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || "medsysve_meta_token_2026"

/**
 * GET /api/webhooks/meta
 * Verificación inicial del webhook requerida por Meta App Dashboard.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
    console.log("[Meta Webhook] Verificación exitosa de token por Meta.")
    return new NextResponse(challenge, { status: 200 })
  }

  console.warn("[Meta Webhook] Intento de verificación fallido token no coincide.")
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

/**
 * POST /api/webhooks/meta
 * Recepción de eventos entrantes de WhatsApp Cloud API, Instagram Direct o Facebook Messenger.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 1. WhatsApp Cloud API Payload
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value
      const message = value?.messages?.[0]

      if (message && message.type === "text") {
        const from = message.from // Número de teléfono del usuario
        const text = message.text?.body
        const contactName = value.contacts?.[0]?.profile?.name

        console.log(`[Meta Webhook - WhatsApp] Mensaje recibido de ${from}: "${text}"`)

        // Procesar asíncronamente con el bot-engine
        await processIncomingMessage({
          channel: "WHATSAPP",
          senderId: from,
          senderName: contactName,
          text,
          botType: "MARKETING", // Default a bot de marketing/ventas si viene por el número principal
        })
      }

      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 })
    }

    // 2. Instagram Direct / Facebook Messenger Payload
    if (body.object === "page" || body.object === "instagram") {
      const entry = body.entry?.[0]
      const messaging = entry?.messaging?.[0]

      if (messaging && messaging.message && messaging.message.text) {
        const senderId = messaging.sender.id
        const text = messaging.message.text
        const channel = body.object === "instagram" ? "INSTAGRAM" : "FACEBOOK"

        console.log(`[Meta Webhook - ${channel}] Mensaje recibido de ${senderId}: "${text}"`)

        await processIncomingMessage({
          channel,
          senderId,
          text,
          botType: "MARKETING",
        })
      }

      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 })
    }

    return NextResponse.json({ status: "IGNORED" }, { status: 200 })
  } catch (error) {
    console.error("[Meta Webhook] Error al procesar payload:", error)
    // Responder siempre 200 a Meta para evitar reintentos continuos por errores sintácticos
    return NextResponse.json({ status: "ERROR_HANDLED" }, { status: 200 })
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
// Meta requires a verify token for the webhook setup
const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || "medsysve_webhook_secure_2026"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verified successfully")
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse("Forbidden", { status: 403 })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate Meta structure
    if (body.object !== "whatsapp_business_account") {
      return new NextResponse("Not Found", { status: 404 })
    }

    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.value && change.value.messages) {
          for (const message of change.value.messages) {
            await handleIncomingMessage(message, change.value.contacts?.[0])
          }
        }
      }
    }

    // Always return 200 OK so Meta doesn't retry
    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

async function handleIncomingMessage(message: any, contact: any) {
  if (message.type !== "text") return // We only handle text for now
  
  const phone = message.from
  const text = message.text.body

  // Insert message into MarketingMessage
  await db.marketingMessage.create({
    data: {
      telefono: phone,
      nombrePerfil: contact?.profile?.name || "Desconocido",
      texto: text,
      direccion: "INBOUND",
      leido: false,
    }
  })

  console.log(`[WhatsApp Webhook] Marketing message processed for ${phone}`)
}

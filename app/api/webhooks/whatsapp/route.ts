import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createHmac } from "crypto"

// Meta requires a verify token for the webhook setup
const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || "medsysve_webhook_secure_2026"
const FIELD_HMAC_KEY = process.env.FIELD_HMAC_KEY

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

  if (!FIELD_HMAC_KEY) {
    console.error("[WhatsApp Webhook] Missing FIELD_HMAC_KEY, cannot lookup patient")
    return
  }

  // Look up patient by phone (HMAC indexed)
  const hmacTelefono = createHmac("sha256", FIELD_HMAC_KEY).update(phone).digest("hex")
  
  const patient = await db.patient.findFirst({
    where: { hmacTelefono },
    include: { registrations: true }
  })

  if (!patient || patient.registrations.length === 0) {
    console.log(`[WhatsApp Webhook] Unrecognized phone number: ${phone}`)
    return
  }

  // Find the first registration (for the first doctor they are registered with)
  const registration = patient.registrations[0]

  // Insert message as PATIENT and canal WHATSAPP
  await db.mensaje.create({
    data: {
      workspaceId: registration.workspaceId,
      patientRegistrationId: registration.id,
      autor: "PATIENT",
      canal: "WHATSAPP",
      texto: text, // Saving plaintext for now, should use textoCifrado in production
      leido: false,
    }
  })

  // Trigger Notification for the doctor
  await db.notification.create({
    data: {
      workspaceId: registration.workspaceId,
      tipo: "WHATSAPP_MESSAGE",
      titulo: `Nuevo WhatsApp de ${patient.nombre} ${patient.apellido}`,
      mensaje: text.length > 50 ? text.substring(0, 50) + "..." : text,
      referenciaId: registration.id, // Linking to patient profile / messages
    }
  })

  console.log(`[WhatsApp Webhook] Message processed for ${phone}`)
}

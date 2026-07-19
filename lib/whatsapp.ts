const WA_URL = process.env.WA_API_URL || "https://graph.facebook.com/v19.0"
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN

async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  parameters: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
    console.warn("[WhatsApp] Not configured — set WA_PHONE_NUMBER_ID and WA_ACCESS_TOKEN")
    return { success: false, error: "not_configured" }
  }

  // Ensure phone number starts with country code and has no formatting
  const phone = to.replace(/\D/g, "")
  if (!phone) return { success: false, error: "invalid_phone" }

  const bodyComponents = parameters.length > 0 ? [{
    type: "body",
    parameters: parameters.map(p => ({ type: "text", text: p }))
  }] : []

  try {
    const res = await fetch(`${WA_URL}/${WA_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "es" },
          components: bodyComponents
        }
      }),
    })
    
    if (!res.ok) {
      const err = await res.text()
      console.error("[WhatsApp] Send failed:", err)
      return { success: false, error: err }
    }
    
    return { success: true }
  } catch (e) {
    console.error("[WhatsApp] Network error:", e)
    return { success: false, error: "network_error" }
  }
}

export async function sendWhatsAppText(
  to: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
    console.warn("[WhatsApp] Not configured")
    return { success: false, error: "not_configured" }
  }

  const phone = to.replace(/\D/g, "")
  if (!phone) return { success: false, error: "invalid_phone" }

  try {
    const res = await fetch(`${WA_URL}/${WA_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "text",
        text: {
          preview_url: false,
          body: text
        }
      }),
    })
    
    if (!res.ok) {
      const err = await res.text()
      console.error("[WhatsApp] Text send failed:", err)
      return { success: false, error: err }
    }
    
    return { success: true }
  } catch (e) {
    console.error("[WhatsApp] Network error:", e)
    return { success: false, error: "network_error" }
  }
}

export async function notifyAppointmentCreated(opts: {
  phone: string
  patientName: string
  doctorName: string
  fechaHora: string
}) {
  return sendWhatsAppTemplate(opts.phone, "appointment_created", [
    opts.patientName,
    opts.doctorName,
    opts.fechaHora
  ])
}

export async function notifyAppointmentConfirmed(opts: {
  phone: string
  patientName: string
  fechaHora: string
}) {
  return sendWhatsAppTemplate(opts.phone, "appointment_confirmed", [
    opts.patientName,
    opts.fechaHora
  ])
}

export async function notifyAppointmentReminder(opts: {
  phone: string
  patientName: string
  doctorName: string
  fechaHora: string
}) {
  return sendWhatsAppTemplate(opts.phone, "appointment_reminder", [
    opts.patientName,
    opts.doctorName,
    opts.fechaHora
  ])
}

export async function notifyDocumentReady(opts: {
  phone: string
  patientName: string
  tipoDocumento: string
}) {
  return sendWhatsAppTemplate(opts.phone, "document_ready", [
    opts.patientName,
    opts.tipoDocumento
  ])
}

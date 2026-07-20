const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || process.env.WA_ACCESS_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WA_PHONE_NUMBER_ID

/**
 * Helper genérico para enviar mensajes a través de la API oficial de WhatsApp Cloud de Meta.
 * Soporta tanto mensajes de texto plano como plantillas (templates).
 */
async function sendMetaWhatsAppMessage(body: any): Promise<{ success: boolean; error?: string }> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("[WhatsApp] Meta API not configured — set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID")
    return { success: false, error: "not_configured" }
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[WhatsApp] Meta API request failed:", errText)
      return { success: false, error: errText }
    }

    return { success: true }
  } catch (e) {
    console.error("[WhatsApp] Meta API connection error:", e)
    return { success: false, error: "network_error" }
  }
}

/**
 * Formatea los números de teléfono al formato requerido por Meta (E.164 sin +).
 * Ejemplo: '584120000000' para Venezuela.
 */
function formatPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1)
  }
  if (cleaned.length === 10) {
    cleaned = "58" + cleaned
  }
  return cleaned
}

/**
 * Envía un mensaje de texto libre. Solo funciona si la ventana de servicio de 24 horas está abierta.
 */
export async function sendWhatsAppTextMessage(to: string, text: string) {
  const phone = formatPhone(to)
  if (!phone) return { success: false, error: "invalid_phone" }

  return sendMetaWhatsAppMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "text",
    text: {
      preview_url: false,
      body: text,
    },
  })
}

/**
 * Alias retrocompatible para el envío de texto plano.
 */
export async function sendWhatsAppText(to: string, text: string) {
  return sendWhatsAppTextMessage(to, text)
}


/**
 * Envía un mensaje basado en plantillas (Templates). Obligatorio para iniciar conversaciones.
 */
export async function sendWhatsAppTemplateMessage(opts: {
  to: string
  templateName: string
  languageCode?: string
  parameters: Array<{ type: "text"; text: string }>
}) {
  const phone = formatPhone(opts.to)
  if (!phone) return { success: false, error: "invalid_phone" }

  return sendMetaWhatsAppMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: {
      name: opts.templateName,
      language: {
        code: opts.languageCode || "es",
      },
      components: [
        {
          type: "body",
          parameters: opts.parameters,
        },
      ],
    },
  })
}

export async function notifyAppointmentCreated(opts: {
  phone: string
  patientName: string
  doctorName: string
  fechaHora: string
}) {
  const templateName = process.env.WHATSAPP_APPOINTMENT_CREATED_TEMPLATE
  if (templateName) {
    return sendWhatsAppTemplateMessage({
      to: opts.phone,
      templateName,
      parameters: [
        { type: "text", text: opts.patientName },
        { type: "text", text: opts.doctorName },
        { type: "text", text: opts.fechaHora },
      ],
    })
  }

  const text = `Hola ${opts.patientName},\n\nTu cita con el/la Dr/a. ${opts.doctorName} ha sido agendada para el ${opts.fechaHora}.\n\n¡Te esperamos!`
  return sendWhatsAppTextMessage(opts.phone, text)
}

export async function notifyAppointmentConfirmed(opts: {
  phone: string
  patientName: string
  fechaHora: string
}) {
  const templateName = process.env.WHATSAPP_APPOINTMENT_CONFIRMED_TEMPLATE
  if (templateName) {
    return sendWhatsAppTemplateMessage({
      to: opts.phone,
      templateName,
      parameters: [
        { type: "text", text: opts.patientName },
        { type: "text", text: opts.fechaHora },
      ],
    })
  }

  const text = `Hola ${opts.patientName},\n\nTu cita del ${opts.fechaHora} ha sido confirmada.\n\nNos vemos pronto.`
  return sendWhatsAppTextMessage(opts.phone, text)
}

export async function notifyAppointmentReminder(opts: {
  phone: string
  patientName: string
  doctorName: string
  fechaHora: string
}) {
  const templateName = process.env.WHATSAPP_APPOINTMENT_REMINDER_TEMPLATE
  if (templateName) {
    return sendWhatsAppTemplateMessage({
      to: opts.phone,
      templateName,
      parameters: [
        { type: "text", text: opts.patientName },
        { type: "text", text: opts.doctorName },
        { type: "text", text: opts.fechaHora },
      ],
    })
  }

  const text = `Recordatorio para ${opts.patientName}:\n\nTienes una cita programada con el/la Dr/a. ${opts.doctorName} el ${opts.fechaHora}.\n\nPor favor asiste con 10 minutos de anticipación.`
  return sendWhatsAppTextMessage(opts.phone, text)
}

export async function notifyDocumentReady(opts: {
  phone: string
  patientName: string
  tipoDocumento: string
}) {
  const templateName = process.env.WHATSAPP_DOCUMENT_READY_TEMPLATE
  if (templateName) {
    return sendWhatsAppTemplateMessage({
      to: opts.phone,
      templateName,
      parameters: [
        { type: "text", text: opts.patientName },
        { type: "text", text: opts.tipoDocumento },
      ],
    })
  }

  const text = `Hola ${opts.patientName},\n\nTu documento "${opts.tipoDocumento}" ya está listo y disponible en tu portal de paciente.\n\nPuedes acceder para revisarlo o descargarlo.`
  return sendWhatsAppTextMessage(opts.phone, text)
}

const OPENWA_URL = process.env.OPENWA_URL || "http://localhost:2785"
const OPENWA_API_KEY = process.env.OPENWA_API_KEY
const OPENWA_SESSION_ID = process.env.OPENWA_SESSION_ID || "default"

async function sendOpenWAMessage(
  to: string,
  text: string,
): Promise<{ success: boolean; error?: string }> {
  if (!OPENWA_API_KEY) {
    console.warn("[WhatsApp] Not configured — set OPENWA_API_KEY")
    return { success: false, error: "not_configured" }
  }

  // Ensure phone number starts with country code and has no formatting
  const phone = to.replace(/\D/g, "")
  if (!phone) return { success: false, error: "invalid_phone" }

  // whatsapp-web.js requires the @c.us suffix
  const jid = `${phone}@c.us`

  try {
    const res = await fetch(`${OPENWA_URL}/api/sessions/${OPENWA_SESSION_ID}/messages/send-text`, {
      method: "POST",
      headers: {
        "X-API-Key": OPENWA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: jid,
        text,
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

export async function notifyAppointmentCreated(opts: {
  phone: string
  patientName: string
  doctorName: string
  fechaHora: string
}) {
  const text = `Hola ${opts.patientName},\n\nTu cita con el/la Dr/a. ${opts.doctorName} ha sido agendada para el ${opts.fechaHora}.\n\n¡Te esperamos!`
  return sendOpenWAMessage(opts.phone, text)
}

export async function notifyAppointmentConfirmed(opts: {
  phone: string
  patientName: string
  fechaHora: string
}) {
  const text = `Hola ${opts.patientName},\n\nTu cita del ${opts.fechaHora} ha sido confirmada.\n\nNos vemos pronto.`
  return sendOpenWAMessage(opts.phone, text)
}

export async function notifyAppointmentReminder(opts: {
  phone: string
  patientName: string
  doctorName: string
  fechaHora: string
}) {
  const text = `Recordatorio para ${opts.patientName}:\n\nTienes una cita programada con el/la Dr/a. ${opts.doctorName} el ${opts.fechaHora}.\n\nPor favor asiste con 10 minutos de anticipación.`
  return sendOpenWAMessage(opts.phone, text)
}

export async function notifyDocumentReady(opts: {
  phone: string
  patientName: string
  tipoDocumento: string
}) {
  const text = `Hola ${opts.patientName},\n\nTu documento "${opts.tipoDocumento}" ya está listo y disponible en tu portal de paciente.\n\nPuedes acceder para revisarlo o descargarlo.`
  return sendOpenWAMessage(opts.phone, text)
}

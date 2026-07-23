import * as nodemailer from "nodemailer"

const SMTP_HOST = process.env.SMTP_HOST ?? process.env.GOOGLE_SMTP_HOST ?? "smtp.gmail.com"
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? process.env.GOOGLE_SMTP_PORT ?? "587", 10)
const SMTP_USER = process.env.SMTP_USER ?? process.env.GOOGLE_SMTP_USER ?? process.env.GMAIL_USER ?? "yoguitech@gmail.com"
const SMTP_PASS =
  process.env.SMTP_PASS ??
  process.env.GOOGLE_SMTP_APP_PASSWORD ??
  process.env.SMTP_PASSWORD ??
  process.env.GMAIL_APP_PASSWORD ??
  "ndpqgftqoufkjich"

const FROM = process.env.MAIL_FROM ?? process.env.EMAIL_FROM ?? "MedSysVE <no-responder@medsysve.com>"
const REPLY_TO = process.env.MAIL_REPLY_TO ?? "admin@medsysve.com"

let cachedTransport: nodemailer.Transporter | null = null

function getTransport(): nodemailer.Transporter | null {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null
  }
  if (cachedTransport) return cachedTransport
  const isGmail = SMTP_HOST.includes("gmail")
  cachedTransport = nodemailer.createTransport({
    ...(isGmail ? { service: "gmail" } : { host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465 }),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    // Reasonable timeouts so a dead SMTP doesn't hang the request
    connectionTimeout: 10_000,
    greetingTimeout: 5_000,
    socketTimeout: 15_000,
  })
  return cachedTransport
}

async function send(opts: {
  to: string
  subject: string
  html: string
  replyTo?: string
  attachments?: { filename: string; content: Buffer }[]
}): Promise<{ success: boolean; error?: string }> {
  const transport = getTransport()
  if (!transport) {
    console.warn("[Email] SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS")
    return { success: false, error: "not_configured" }
  }
  if (!opts.to) return { success: false, error: "no_recipient" }

  try {
    const info = await transport.sendMail({
      from: FROM,
      to: opts.to,
      replyTo: opts.replyTo ?? REPLY_TO,
      subject: opts.subject,
      html: opts.html,
      // Plain-text fallback (auto-generated from HTML if absent)
      text: opts.html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      attachments: opts.attachments,
    })
    console.info(`[Email] Sent to ${opts.to}: ${info.messageId}`)
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[Email] Send failed to ${opts.to}:`, msg)
    return { success: false, error: msg }
  }
}

function base(content: string): string {
  return `<!DOCTYPE html><html lang="es"><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;">
<div style="max-width:520px;margin:auto;background:#1e293b;border-radius:8px;padding:32px;">
<p style="color:#60a5fa;font-weight:700;font-size:18px;margin-top:0;">MedSysVE</p>
${content}
<hr style="border:none;border-top:1px solid #334155;margin:24px 0;"/>
<p style="font-size:11px;color:#64748b;margin:0;">Este mensaje fue generado automáticamente. Por favor no responda a este correo — para soporte escriba a ${REPLY_TO}.</p>
</div></body></html>`
}

export async function sendAppointmentCreated(opts: {
  to: string
  patientName: string
  fechaHora: string
  doctorName: string
}) {
  return send({
    to: opts.to,
    subject: "Cita agendada — MedSysVE",
    html: base(`
      <p>Estimado/a <strong>${opts.patientName}</strong>,</p>
      <p>Se ha agendado una nueva cita con <strong>${opts.doctorName}</strong>.</p>
      <p style="background:#0f172a;padding:16px;border-radius:6px;font-size:16px;">📅 ${opts.fechaHora}</p>
      <p>Si tiene alguna duda o necesita reprogramar, por favor comuníquese con el consultorio.</p>
    `),
  })
}

export async function sendAppointmentConfirmed(opts: {
  to: string
  patientName: string
  fechaHora: string
  doctorName: string
}) {
  return send({
    to: opts.to,
    subject: "Cita confirmada — MedSysVE",
    html: base(`
      <p>Estimado/a <strong>${opts.patientName}</strong>,</p>
      <p>Su cita con <strong>${opts.doctorName}</strong> ha sido <strong style="color:#4ade80;">confirmada</strong>.</p>
      <p style="background:#0f172a;padding:16px;border-radius:6px;font-size:16px;">📅 ${opts.fechaHora}</p>
      <p>Si no puede asistir, por favor comuníquese con el consultorio con anticipación.</p>
    `),
  })
}

export async function sendEncounterSummary(opts: {
  to: string
  patientName: string
  doctorName: string
  attachments: { filename: string; content: Buffer }[]
}) {
  return send({
    to: opts.to,
    subject: "Resumen de su consulta médica — MedSysVE",
    attachments: opts.attachments,
    html: base(`
      <p>Estimado/a <strong>${opts.patientName}</strong>,</p>
      <p>A continuación adjuntamos los documentos generados durante su consulta con <strong>${opts.doctorName}</strong>.</p>
      <p>En los archivos adjuntos podrá encontrar su resumen clínico, récipes, indicaciones y órdenes médicas correspondientes.</p>
      <p style="margin-top:24px;font-size:14px;color:#94a3b8;">
        Nota: Estos documentos se envían sin firma ni sello para su referencia personal. 
        Si requiere los documentos oficiales firmados, solicítelos directamente en el consultorio.
      </p>
    `),
  })
}

export async function sendAppointmentReminder(opts: {
  to: string
  patientName: string
  fechaHora: string
  doctorName: string
}) {
  return send({
    to: opts.to,
    subject: "Recordatorio de cita — MedSysVE",
    html: base(`
      <p>Estimado/a <strong>${opts.patientName}</strong>,</p>
      <p>Le recordamos que tiene una cita programada con <strong>${opts.doctorName}</strong>.</p>
      <p style="background:#0f172a;padding:16px;border-radius:6px;font-size:16px;">📅 ${opts.fechaHora}</p>
      <p>Recuerde traer su documentación médica si aplica.</p>
    `),
  })
}

export async function sendDocumentReady(opts: {
  to: string
  patientName: string
  tipoDocumento: string
  portalUrl?: string
}) {
  const link = opts.portalUrl
    ? `<p><a href="${opts.portalUrl}" style="color:#60a5fa;">Ver documento en el portal</a></p>`
    : ""
  return send({
    to: opts.to,
    subject: `${opts.tipoDocumento} disponible — MedSysVE`,
    html: base(`
      <p>Estimado/a <strong>${opts.patientName}</strong>,</p>
      <p>Su <strong>${opts.tipoDocumento}</strong> ha sido firmado y está disponible en su portal de paciente.</p>
      ${link}
    `),
  })
}

export async function sendPortalWelcome(opts: {
  to: string
  nombre: string
  password: string
  portalUrl?: string
}) {
  const url = opts.portalUrl ?? process.env.NEXTAUTH_URL
  return send({
    to: opts.to,
    subject: "Bienvenido a su Portal de Paciente — MedSysVE",
    html: base(`
      <p>Estimado/a <strong>${opts.nombre}</strong>,</p>
      <p>Su médico ha activado su acceso al portal de paciente de <strong>MedSysVE</strong>, donde podrá consultar sus documentos médicos y solicitar citas.</p>
      <div style="background:#0f172a;padding:20px;border-radius:6px;margin:16px 0;">
        <p style="margin:0;font-size:13px;color:#94a3b8;">Correo electrónico</p>
        <p style="margin:4px 0 12px;font-weight:700;">${opts.to}</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;">Contraseña temporal</p>
        <p style="margin:4px 0;font-weight:700;font-size:22px;letter-spacing:3px;">${opts.password}</p>
      </div>
      ${url ? `<p><a href="${url}/portal/login" style="color:#60a5fa;">Ingresar al portal</a></p>` : ""}
      <p style="color:#94a3b8;font-size:13px;">Por seguridad, le recomendamos cambiar su contraseña al ingresar por primera vez.</p>
    `),
  })
}

export async function sendPortalReminderEmail(opts: {
  to: string
  nombre: string
  doctorName: string
  portalUrl?: string
}) {
  const url = opts.portalUrl ?? process.env.NEXTAUTH_URL
  return send({
    to: opts.to,
    subject: "Acceso a Portal de Paciente — MedSysVE",
    html: base(`
      <p>Estimado/a <strong>${opts.nombre}</strong>,</p>
      <p>El <strong>${opts.doctorName}</strong> ha habilitado su perfil en el portal de paciente de <strong>MedSysVE</strong>.</p>
      <p>Como usted ya posee una cuenta activa en la plataforma, puede ingresar con su correo y contraseña habituales.</p>
      <div style="background:#0f172a;padding:20px;border-radius:6px;margin:16px 0;">
        <p style="margin:0;font-size:13px;color:#94a3b8;">Correo electrónico</p>
        <p style="margin:4px 0;font-weight:700;">${opts.to}</p>
      </div>
      ${url ? `<p><a href="${url}/portal/login" style="color:#60a5fa;">Ingresar al portal</a></p>` : ""}
    `),
  })
}

export async function sendInvoiceEmail(opts: {
  to: string
  patientName: string
  numero: string
  montoUsd: string
  fecha: string
  pdfUrl?: string
}): Promise<{ success: boolean; error?: string }> {
  const pdfLine = opts.pdfUrl
    ? `<p style="margin-top:12px"><a href="${opts.pdfUrl}" style="color:#60a5fa;">Ver / descargar recibo en PDF</a></p>`
    : ""
  return send({
    to: opts.to,
    subject: `Recibo de consulta ${opts.numero} — MedSysVE`,
    html: base(`
      <p>Estimado/a <strong>${opts.patientName}</strong>,</p>
      <p>Le enviamos el recibo correspondiente a su consulta médica.</p>
      <div style="background:#0f172a;padding:16px;border-radius:6px;margin:16px 0;">
        <p style="margin:0;color:#94a3b8;font-size:13px;">Número de recibo</p>
        <p style="margin:4px 0 12px;font-weight:700;">${opts.numero}</p>
        <p style="margin:0;color:#94a3b8;font-size:13px;">Monto</p>
        <p style="margin:4px 0 12px;font-weight:700;font-size:20px;">$${opts.montoUsd} USD</p>
        <p style="margin:0;color:#94a3b8;font-size:13px;">Fecha</p>
        <p style="margin:4px 0;font-weight:700;">${opts.fecha}</p>
      </div>
      ${pdfLine}
    `),
  })
}

export async function sendReferralNotification(opts: {
  to: string
  receivingDoctorName: string
  sendingDoctorName: string
  patientName: string
  especialidad: string
  motivo?: string
}) {
  return send({
    to: opts.to,
    subject: `Referido médico — ${opts.patientName}`,
    html: base(`
      <p>Estimado/a <strong>Dr/a. ${opts.receivingDoctorName}</strong>,</p>
      <p>El <strong>Dr/a. ${opts.sendingDoctorName}</strong> ha generado un referido para su paciente:</p>
      <div style="background:#0f172a;padding:16px;border-radius:6px;margin:16px 0;">
        <p style="margin:0;color:#94a3b8;font-size:13px;">Paciente</p>
        <p style="margin:4px 0 12px;font-weight:700;">${opts.patientName}</p>
        <p style="margin:0;color:#94a3b8;font-size:13px;">Referido a</p>
        <p style="margin:4px 0;font-weight:700;">${opts.especialidad}</p>
        ${opts.motivo ? `<p style="margin:12px 0 0;color:#cbd5e1;">${opts.motivo}</p>` : ""}
      </div>
      <p>El documento completo estará disponible en el expediente clínico del paciente.</p>
    `),
  })
}

/**
 * Send a 6-digit one-time code for email verification or password reset.
 * Body uses a larger monospaced block so the code is easy to read on mobile.
 */
export async function sendOtpEmail(opts: {
  to: string
  code: string
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET"
  expiresInMinutes: number
}) {
  const subjectMap = {
    EMAIL_VERIFY: "Verifica tu correo — MedSysVE",
    PASSWORD_RESET: "Recuperación de contraseña — MedSysVE",
  } as const
  const introMap = {
    EMAIL_VERIFY: "Usa este código para confirmar tu dirección de correo y completar tu registro en MedSysVE.",
    PASSWORD_RESET: "Usa este código para restablecer la contraseña de tu cuenta en MedSysVE.",
  } as const
  return send({
    to: opts.to,
    subject: subjectMap[opts.purpose],
    html: base(`
      <p>Hola,</p>
      <p>${introMap[opts.purpose]}</p>
      <div style="background:#0f172a;padding:24px;border-radius:8px;margin:24px 0;text-align:center">
        <p style="margin:0;font-size:12px;color:#94a3b8;letter-spacing:0.15em;text-transform:uppercase">Tu código de verificación</p>
        <p style="margin:12px 0 8px;font-family:'Courier New',monospace;font-weight:900;font-size:42px;letter-spacing:10px;color:#FFD100">${opts.code}</p>
        <p style="margin:0;font-size:12px;color:#94a3b8">Caduca en ${opts.expiresInMinutes} minutos · uso único</p>
      </div>
      <p style="color:#94a3b8;font-size:13px;">Si no solicitaste este código, puedes ignorar este mensaje. Tu cuenta permanece segura.</p>
    `),
  })
}

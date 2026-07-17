import { encode } from "@auth/core/jwt"
import { db } from "@/lib/db"
import { decryptField } from "@/lib/field-crypto"
import { sendEncounterSummary } from "@/lib/email"
import { pdfFilename } from "@/lib/pdf/filename"

export async function generateAndSendEncounterSummary(encounterId: string) {
  // 1. Fetch encounter to know what documents exist
  const enc = await db.encounter.findUnique({
    where: { id: encounterId },
    include: {
      prescriptions: { select: { id: true, createdAt: true } },
      labOrders: { select: { id: true, createdAt: true } },
      imagingOrders: { select: { id: true, createdAt: true } },
      patientRegistration: { include: { patient: true } },
      workspace: { include: { doctor: true } }
    }
  })
  if (!enc) return
  
  const pat = enc.patientRegistration.patient
  const email = pat.email || (pat.emailCifrado ? decryptField(pat.emailCifrado) : null)
  if (!email) return // No email to send to
  
  const nombre = pat.nombre || (pat.nombreCifrado ? decryptField(pat.nombreCifrado) : "") || ""
  const apellido = pat.apellido || (pat.apellidoCifrado ? decryptField(pat.apellidoCifrado) : "") || ""

  // 2. Mint a PATIENT JWT so the API returns omitSello (unsigned) PDFs
  const token = await encode({
    token: {
      id: pat.id,
      email: email,
      nombre: nombre,
      apellido: apellido,
      role: "PATIENT",
      patientId: pat.id,
    },
    secret: process.env.AUTH_SECRET!,
    salt: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
    maxAge: 5 * 60,
  })
  const cookieName = process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token"
  
  const headers = { 
    Cookie: `${cookieName}=${token}; authjs.session-token=${token}`,
    "x-forwarded-proto": "https"
  }
  // Always hit loopback to avoid hairpin NAT / DNS timeouts inside container
  const baseUrl = `http://127.0.0.1:${process.env.PORT || 3000}`
  
  const attachments: { filename: string; content: Buffer }[] = []
  
  // Helper to fetch and attach
  async function fetchPdf(urlPath: string, prefix: string) {
    try {
      const res = await fetch(`${baseUrl}${urlPath}?preview=1`, { headers })
      if (!res.ok) {
        console.error(`[Email Summary] Failed to fetch PDF ${urlPath}: ${res.status}`)
        return
      }
      const arrayBuffer = await res.arrayBuffer()
      const filename = `preview-${pdfFilename(prefix, nombre, apellido, new Date())}`
      attachments.push({ filename, content: Buffer.from(arrayBuffer) })
    } catch (e) {
      console.error(`[Email Summary] Error fetching PDF ${urlPath}`, e)
    }
  }

  // Fetch Encounter Summary
  await fetchPdf(`/api/pdf/encounter/${enc.id}`, "resumen_consulta")
  
  // Fetch Prescriptions
  for (const pres of enc.prescriptions) {
    await fetchPdf(`/api/pdf/prescription/${pres.id}`, "receta")
  }
  
  // Fetch Lab Orders
  for (const lo of enc.labOrders) {
    await fetchPdf(`/api/pdf/lab-order/${lo.id}`, "orden_laboratorio")
  }
  
  // Fetch Imaging Orders
  for (const io of enc.imagingOrders) {
    await fetchPdf(`/api/pdf/imaging-order/${io.id}`, "orden_imagen")
  }
  
  // Send email
  if (attachments.length > 0) {
    const doctorName = `Dr. ${enc.workspace.doctor.nombre} ${enc.workspace.doctor.apellido}`
    await sendEncounterSummary({
      to: email,
      patientName: `${nombre} ${apellido}`.trim(),
      doctorName,
      attachments,
    })
  }
}

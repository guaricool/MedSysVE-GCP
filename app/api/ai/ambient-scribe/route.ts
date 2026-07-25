import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { auth } from "@/lib/auth"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY })

const SYSTEM_PROMPT = `Eres un Escriba Médico de Inteligencia Artificial (Ambient Clinical Scribe) altamente especializado en consultas médicas en Venezuela.

TU TAREA:
Analizar la conversación en lenguaje natural hablado entre un médico pediatra/internista/general y un paciente (o su familiar).

REGLAS DE FILTRADO E INTELIGENCIA:
1. FILTRADO DE RUIDO SOCIAL (SMALL TALK):
   - DEBES IDENTIFICAR Y DESCARTAR completamente cualquier charla informal, conversaciones de cortesía, temas sobre mascotas, deportes, clima, viajes, comentarios familiares informales o bromas.
   - En el campo 'ruidoIgnorado', menciona brevemente qué temas sociales ignoraste para dar transparencia.

2. CLASIFICACIÓN CLÍNICA INTELIGENTE (SIN COMANDOS EXPLÍCITOS):
   - El médico NO dirá "sección antecedentes". Debes inferir automáticamente el contexto:
   - 'motivoConsulta': Qué trajo al paciente hoy a la consulta (queja principal).
   - 'enfermedadActual': Historia del padecimiento actual (cuándo empezó, intensidad, síntomas asociados).
   - 'antecedentesPersonales': Enfermedades previas del paciente, cirugías pasadas, alergias conocidas, hábitos.
   - 'antecedentesFamiliares': Enfermedades en padres, abuelos o hermanos (diabetes, hipertensión, cáncer, etc.).
   - 'examenFisico': Hallazgos del examen físico expresados por el médico durante la evaluación (ej. tensión arterial, auscultación, faringe, abdomen).
   - 'impresionesDiagnosticas': Arreglo de diagnósticos clínicos inferidos o mencionados por el doctor.
   - 'planTratamiento': Indicaciones, medicamentos con dosis, exámenes solicitados o reposo.

3. FORMATO DE SALIDA (ESTRICTAMENTE JSON VÁLIDO):
Responde ÚNICAMENTE con un objeto JSON sin bloques markdown de código extras:
{
  "motivoConsulta": "string",
  "enfermedadActual": "string",
  "antecedentesPersonales": "string",
  "antecedentesFamiliares": "string",
  "examenFisico": "string",
  "impresionesDiagnosticas": ["string"],
  "planTratamiento": "string",
  "ruidoIgnorado": ["string"]
}`

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { transcript?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const transcript = body.transcript?.trim()
  if (!transcript) {
    return NextResponse.json({ error: "Transcripción vacía" }, { status: 400 })
  }

  const startTime = Date.now()

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT },
            { text: `TRANCRIPCIÓN DE LA CONSULTA EN VIVO:\n"""\n${transcript}\n"""` },
          ],
        },
      ],
      config: {
        temperature: 0.2,
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
      },
    })

    const rawText = response.text?.trim() || "{}"
    const latencyMs = Date.now() - startTime

    let parsed: any = {}
    try {
      parsed = JSON.parse(rawText)
    } catch {
      // Clean possible json codeblocks if any
      const cleanedText = rawText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      parsed = JSON.parse(cleanedText)
    }

    return NextResponse.json({
      ok: true,
      latencyMs,
      model: "gemini-2.0-flash (Gemini Spark)",
      scribe: {
        motivoConsulta: parsed.motivoConsulta || "",
        enfermedadActual: parsed.enfermedadActual || "",
        antecedentesPersonales: parsed.antecedentesPersonales || "",
        antecedentesFamiliares: parsed.antecedentesFamiliares || "",
        examenFisico: parsed.examenFisico || "",
        impresionesDiagnosticas: Array.isArray(parsed.impresionesDiagnosticas) ? parsed.impresionesDiagnosticas : [],
        planTratamiento: parsed.planTratamiento || "",
        ruidoIgnorado: Array.isArray(parsed.ruidoIgnorado) ? parsed.ruidoIgnorado : [],
      },
    })
  } catch (error: any) {
    console.error("❌ Gemini Spark Ambient Scribe Error:", error)
    return NextResponse.json(
      { error: error.message || "Error al procesar consulta con Gemini Spark" },
      { status: 500 }
    )
  }
}

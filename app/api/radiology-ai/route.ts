import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI, Type, Schema } from "@google/genai"
import { auth } from "@/lib/auth"
import { isAIFeatureEnabled } from "@/lib/feature-flags"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY })

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isAIFeatureEnabled(session)) {
    return NextResponse.json(
      { error: "Funcionalidad de IA temporalmente deshabilitada" },
      { status: 503 },
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no soportado. Use JPEG, PNG, GIF o WebP." },
      { status: 400 },
    )
  }

  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "El archivo no puede superar 5 MB." }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp"

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      hallazgos: {
        type: Type.STRING,
        description: "Descripción detallada de los hallazgos radiológicos, incluyendo cualquier anormalidad, fractura, signos de consolidación, o alineación."
      },
      impresion: {
        type: Type.STRING,
        description: "Impresión diagnóstica o conclusión clínica concisa."
      }
    },
    required: ["hallazgos", "impresion"]
  }

  try {
    let response: any
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: base64, mimeType: mediaType } },
              { text: "Eres un radiólogo experto analizando una imagen médica. Identifica los hallazgos radiológicos y brinda una impresión diagnóstica." }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          maxOutputTokens: 2048,
        }
      })
    } catch {
      response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: base64, mimeType: mediaType } },
              { text: "Eres un radiólogo experto analizando una imagen médica. Identifica los hallazgos radiológicos y brinda una impresión diagnóstica." }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          maxOutputTokens: 2048,
        }
      })
    }

    const raw = response.text || ""
    const parsedData = JSON.parse(raw)
    return NextResponse.json({ data: parsedData })
  } catch (err: any) {
    console.error("Radiology AI Error:", err)
    return NextResponse.json(
      { error: err?.message || "No se pudo procesar la apreciación por IA en este momento." },
      { status: 500 }
    )
  }
}

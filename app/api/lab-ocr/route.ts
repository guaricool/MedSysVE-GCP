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
      valores: {
        type: Type.ARRAY,
        description: "Lista de resultados de laboratorio encontrados en el documento.",
        items: {
          type: Type.OBJECT,
          properties: {
            parametro: { type: Type.STRING, description: "Nombre del parámetro (ej. Hematocrito, Glucosa)" },
            valor: { type: Type.STRING, description: "Valor numérico o resultado exacto (ej. 45.2, Positivo)" },
            unidad: { type: Type.STRING, description: "Unidad de medida (ej. %, mg/dL). Vacio si no aplica." },
            rangoReferencia: { type: Type.STRING, description: "Rango de normalidad (ej. 40-54, < 200). Vacio si no aplica." }
          },
          required: ["parametro", "valor"]
        }
      },
      notasOriginales: {
        type: Type.STRING,
        description: "Cualquier observación adicional, conclusiones, o texto que no encaje como parámetro."
      }
    },
    required: ["valores"]
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: base64, mimeType: mediaType } },
          { text: "Eres un médico analizando un resultado de laboratorio. Tu única tarea es extraer la data en formato estructurado de acuerdo al esquema indicado.\n\nREGLAS ESTRICTAS:\n1. DEBES crear un elemento en el arreglo 'valores' por CADA parámetro que aparezca en la imagen (ej: Hemoglobina, Leucocitos, Glucosa, etc).\n2. PROHIBIDO agrupar los resultados como texto libre en 'notasOriginales'. Si ves un número asociado a un nombre de examen, VA en 'valores'.\n3. Usa 'notasOriginales' SOLO para conclusiones o texto narrativo al final del documento." }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      maxOutputTokens: 2048,
    }
  })

  const raw = response.text || ""
  try {
    const parsedData = JSON.parse(raw)
    return NextResponse.json({ data: parsedData })
  } catch (err) {
    console.error("Failed to parse Gemini response for lab OCR:", raw)
    return NextResponse.json({ error: "No se pudo extraer data estructurada del laboratorio." }, { status: 500 })
  }
}

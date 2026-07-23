import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI, Type, Schema } from "@google/genai"
import { auth } from "@/lib/auth"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY })

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Form data inválido" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No se proporcionó imagen" }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no soportado. Use JPEG, PNG, GIF o WebP." },
      { status: 400 },
    )
  }

  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "La imagen no puede superar 10 MB." }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp"

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      vacunas: {
        type: Type.ARRAY,
        description: "Lista de vacunas encontradas en la tarjeta o cartilla de vacunación.",
        items: {
          type: Type.OBJECT,
          properties: {
            vacuna: {
              type: Type.STRING,
              description: "Nombre de la vacuna (ej. BCG, Hepatitis B, DPT, Polio, Rotavirus, Neumococo, SRP, Varicela, Fiebre Amarilla, VPH, Influenza, COVID-19)."
            },
            fechaAplicacion: {
              type: Type.STRING,
              description: "Fecha de aplicación en formato YYYY-MM-DD."
            },
            dosis: {
              type: Type.STRING,
              description: "Número o tipo de dosis (ej. 1ra Dosis, 2da Dosis, Refuerzo, Dosis Única). Vacio si no especifica."
            },
            lote: {
              type: Type.STRING,
              description: "Número de lote del biológico si aparece en la estampilla o sello. Vacio si no especifica."
            },
            proximaDosis: {
              type: Type.STRING,
              description: "Fecha programada de la próxima cita/dosis en formato YYYY-MM-DD. Vacio si no especifica."
            },
            aplicadoPor: {
              type: Type.STRING,
              description: "Nombre del hospital, centro de salud o profesional que aplicó la vacuna si aparece."
            },
            notas: {
              type: Type.STRING,
              description: "Observaciones, sello o notas especiales."
            }
          },
          required: ["vacuna", "fechaAplicacion"]
        }
      },
      resumenDiagnostico: {
        type: Type.STRING,
        description: "Resumen explicativo de lo que se observó en la tarjeta de vacunas."
      }
    },
    required: ["vacunas"]
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: base64, mimeType: mediaType } },
            {
              text: "Eres un médico pediatra e inmunólogo analizando la foto de una tarjeta o cartilla física de vacunación de un paciente.\n\nTU MISION:\n1. Analizar la imagen con máxima precisión OCR y extraer CADA UNA de las vacunas registradas con su fecha de aplicación (en formato YYYY-MM-DD), número de dosis, lote y observaciones.\n2. Mapear los nombres de las vacunas a la nomenclatura estándar médica venezolana e internacional (BCG, Hepatitis B, DPT, Polio, Rotavirus, Neumococo, SRP, Varicela, Fiebre Amarilla, VPH, Influenza, COVID-19, etc.).\n3. Si hay fechas escritas a mano o sellos borrosos, haz tu mejor esfuerzo por descifrar el año, mes y día."
            }
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
    const parsedData = JSON.parse(raw)
    return NextResponse.json({ data: parsedData })
  } catch (err: any) {
    console.error("AI Vaccine OCR failed:", err)
    return NextResponse.json(
      { error: `Error al procesar tarjeta de vacunas: ${err?.message || "No se pudo leer la foto"}` },
      { status: 500 }
    )
  }
}

import { GoogleAuth } from "google-auth-library";

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "medsysve-gcp";
const LOCATION = process.env.GCP_LOCATION || "us-central1";

async function getAccessToken(): Promise<string | null> {
  try {
    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token || null;
  } catch (err: any) {
    console.warn("[Vertex AI Auth Error]:", err?.message || err);
    return null;
  }
}

export async function generateVertexAICopy(
  topic: string,
  keyBenefits: string,
  specialty: string
): Promise<{ caption: string; hashtags: string; imagePrompt: string }> {
  const token = await getAccessToken();

  const fallbackCopy = {
    caption: `🩺 Consulta médica de ${specialty} en Venezuela: ${topic}. Con MedSysVE optimizas tu tiempo, emites recetas seguras con código QR y controlas la facturación a tasa oficial BCV. ¡Pruébalo gratis en www.medsysve.com! 🇻🇪✨`,
    hashtags: `#MedSysVE #SaludVenezuela #DoctoresVenezuela #${specialty.replace(/[\s\(\)]+/g, "")} #HistoriaClinica`,
    imagePrompt: `A professional ${specialty} doctor in Venezuela using modern digital health software on a tablet, 8k, cinematic photo`,
  };

  if (!token) return fallbackCopy;

  const promptText = `Eres el Director de Marketing y Copywriter Senior de MedSysVE, la plataforma SaaS médica líder en Venezuela (www.medsysve.com).
Crea un post sumamente persuasivo, profesional y atractivo para Instagram y Facebook dirigido a médicos especialistas en "${specialty}".

Tema del Post: "${topic}"
Beneficios Claves del Sistema: "${keyBenefits}"

Requisitos:
1. "caption": Un texto persuasivo de 120 a 200 palabras enfocado en aportar valor al doctor en su día a día en Venezuela. Utiliza emojicraft moderado, párrafos cortos y termina con un llamado a la acción (CTA) invitándolos a registrarse en www.medsysve.com.
2. "hashtags": De 6 a 10 hashtags relevantes combinando el producto (#MedSysVE), la medicina en Venezuela (#MedicinaVenezuela #SaludVenezuela #DoctorVenezolano) y la especialidad (#${specialty.replace(/[\s\(\)]+/g, "")}).
3. "imagePrompt": Un prompt detallado en inglés para generar una imagen cuadrada 1:1 en Imagen 3 enfocada en la especialidad médica "${specialty}" y la tecnología médica de MedSysVE.

Responde ÚNICAMENTE en formato JSON válido con la estructura:
{
  "caption": "...",
  "hashtags": "...",
  "imagePrompt": "..."
}`;

  const modelsToTry = ["gemini-2.0-flash-001", "gemini-1.5-flash-002", "gemini-1.5-flash"];

  for (const model of modelsToTry) {
    try {
      const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = JSON.parse(rawText);
        return {
          caption: parsed.caption || fallbackCopy.caption,
          hashtags: parsed.hashtags || fallbackCopy.hashtags,
          imagePrompt: parsed.imagePrompt || fallbackCopy.imagePrompt,
        };
      }
    } catch (err) {
      console.warn(`[Vertex AI Copy Generation Error on ${model}]:`, err);
    }
  }

  return fallbackCopy;
}

export async function generateVertexAIImagen3(
  prompt: string,
  style: "hyperrealistic" | "cartoon"
): Promise<Buffer | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const fullPrompt = style === "cartoon"
    ? `3D Pixar Disney style digital illustration of ${prompt}, bright vibrant colors, friendly Venezuelan medical doctor, digital medical chart tablet, clean modern aesthetic, 1:1 aspect ratio, high resolution`
    : `Hyper-realistic 8k cinematic photograph of ${prompt}, Venezuelan medical doctor context, modern clean clinic setting, professional studio lighting, 1:1 square format`;

  const publisherModels = [
    "imagen-3.0-generate-002",
    "imagen-3.0-fast-generate-001",
    "imagegeneration@006",
    "imagegeneration@005",
  ];

  for (const model of publisherModels) {
    try {
      const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}:predict`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{ prompt: fullPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
            outputOptions: { mimeType: "image/png" },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const b64 = data?.predictions?.[0]?.bytesBase64;
        if (b64) {
          console.log(`[Vertex AI Imagen 3 Success]: Image generated via ${model}`);
          return Buffer.from(b64, "base64");
        }
      } else {
        const errText = await res.text();
        console.warn(`[Vertex AI Imagen 3 ${model} status ${res.status}]:`, errText);
      }
    } catch (err: any) {
      console.warn(`[Vertex AI Imagen 3 exception on ${model}]:`, err?.message || err);
    }
  }

  return null;
}

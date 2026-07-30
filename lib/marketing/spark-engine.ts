import { GoogleGenAI } from "@google/genai";
import { generateVertexAICopy } from "./vertex-ai";

async function getSecret(secretName: string): Promise<string | undefined> {
  if (process.env[secretName] && process.env[secretName]!.trim().length > 0) {
    return process.env[secretName]!.trim();
  }
  try {
    const tokenRes = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", {
      headers: { "Metadata-Flavor": "Google" }
    });
    if (!tokenRes.ok) return process.env[secretName];
    const { access_token } = await tokenRes.json();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || "medsysve-gcp";
    const secretRes = await fetch(`https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets/${secretName}/versions/latest:access`, {
      headers: { "Authorization": `Bearer ${access_token}` }
    });
    const secretData = await secretRes.json();
    if (!secretData || !secretData.payload) {
      return process.env[secretName];
    }
    return Buffer.from(secretData.payload.data, "base64").toString("utf8").trim();
  } catch (e) {
    return process.env[secretName];
  }
}

export interface SparkMultiFormatOutput {
  feedCaption: string;
  hashtags: string;
  reelScript: string;
  storyInteractiveText: string;
  imagePrompt: string;
}

export async function generateSparkMarketingSuite(
  specialty: string,
  topic: string
): Promise<SparkMultiFormatOutput> {
  const apiKey = await getSecret("GEMINI_API_KEY");

  if (!apiKey) {
    const baseCopy = await generateVertexAICopy(topic, "Historias SOAP, PACS y Tasa BCV", specialty);
    return {
      feedCaption: baseCopy.caption,
      hashtags: baseCopy.hashtags,
      reelScript: `🎬 [REEL 15s - MedSysVE para ${specialty}]\n"¿Doctor en Venezuela? Con MedSysVE registras historias clínicas SOAP en segundos, emites recetas con código QR verificado y cobras con la tasa oficial BCV. Pruébalo gratis hoy en medsysve.com"`,
      storyInteractiveText: `💡 ¿Cuánto tiempo ahorras al día en tus historias clínicas? Encuesta: [1 Hora / +2 Horas]`,
      imagePrompt: baseCopy.imagePrompt,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Eres el Motor Gemini Spark de Inteligencia Artificial Clínica y Marketing Médico de MedSysVE (www.medsysve.com).

Genera un paquete completo de marketing de alta conversión para la especialidad médica "${specialty}" en Venezuela.

Tema Principal: "${topic}"

Requisitos:
1. "feedCaption": Post persuasivo para Instagram/Facebook (120-180 palabras), adaptado a la realidad del médico venezolano (tasa BCV, recetas infalsificables, historias rápidas SOAP).
2. "hashtags": 6-8 hashtags relevantes (#MedSysVE #SaludVenezuela #${specialty.replace(/[\s\(\)]+/g, "")}).
3. "reelScript": Guión de 15 segundos para Instagram Reel / TikTok con marcas de tiempo [0-5s, 5-10s, 10-15s] listo para que el médico o actor lo grabe.
4. "storyInteractiveText": Texto interactivo corto y directo para una Instagram Story con sticker de encuesta o pregunta.
5. "imagePrompt": Prompt fotográfico profesional en inglés para generar una imagen médica de alta calidad en Imagen 3.

Responde ÚNICAMENTE en JSON válido con las llaves exactamente nombradas:
{
  "feedCaption": "...",
  "hashtags": "...",
  "reelScript": "...",
  "storyInteractiveText": "...",
  "imagePrompt": "..."
}`;

    const res = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(res?.text || "{}");

    return {
      feedCaption: parsed.feedCaption || `🩺 Optimiza tu consulta de ${specialty} con MedSysVE. ${topic}. Registra historias clínicas SOAP e imprime recetas con código QR. Visita www.medsysve.com`,
      hashtags: parsed.hashtags || `#MedSysVE #MedicinaVenezuela #${specialty.replace(/[\s\(\)]+/g, "")}`,
      reelScript: parsed.reelScript || `🎬 [REEL 15s]: "¿Cansado del papeleo médico? MedSysVE automatiza tus récipes y consultas en Venezuela. Registrate en medsysve.com"`,
      storyInteractiveText: parsed.storyInteractiveText || `📊 ¿Usas la tasa BCV para tus consultas en Venezuela? [Sí / No]`,
      imagePrompt: parsed.imagePrompt || `A professional ${specialty} doctor in Venezuela using modern digital health software on a tablet, 8k, cinematic photo`,
    };
  } catch (err: any) {
    console.warn("[Gemini Spark Marketing Suite Exception]:", err?.message || err);
    const baseCopy = await generateVertexAICopy(topic, "Historias SOAP, PACS y Tasa BCV", specialty);
    return {
      feedCaption: baseCopy.caption,
      hashtags: baseCopy.hashtags,
      reelScript: `🎬 [REEL 15s]: "Optimiza tus consultas de ${specialty} en Venezuela con MedSysVE. Registrate en medsysve.com"`,
      storyInteractiveText: `💡 ¿Emites récipes con código QR? [Sí / No]`,
      imagePrompt: baseCopy.imagePrompt,
    };
  }
}

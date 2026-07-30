import { GoogleGenAI } from "@google/genai";

export async function generateContentForImage(imageBuffer: Buffer, apiKey: string, moduleDescription: string): Promise<{caption: string, hashtags: string}> {
  console.log("Sending image to Google AI Studio (Gemini 2.0)...");
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Eres un Community Manager experto en SaaS médico en Venezuela. 
Analiza esta captura de pantalla de nuestro sistema MedSysVE y crea un texto atractivo para Instagram destacando las funcionalidades visibles.

Contexto sobre la imagen mostrada:
"${moduleDescription}"

Retorna un JSON estructurado de esta manera:
{
  "caption": "Tu texto aquí, atractivo y persuasivo, usa emojis y haz un Call-to-Action.",
  "hashtags": "#medsysve #saas #medicosvenezolanos #historiaclinica"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: "image/png"
          }
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const textResponse = response.text || "{}";
    const result = JSON.parse(textResponse);
    return {
      caption: result.caption || "¡Descubre la nueva función de MedSysVE!",
      hashtags: result.hashtags || "#medsysve"
    };
  } catch (error) {
    console.error("Error calling Google AI Studio:", error);
    throw error;
  }
}

export async function generateAIImage(prompt: string, apiKey: string, style: "hyperrealistic" | "cartoon" = "hyperrealistic"): Promise<Buffer> {
  console.log("Generating image with Google Imagen 3 API...");
  try {
    const fullPrompt = style === "cartoon"
      ? `3D Pixar Disney style digital illustration of ${prompt}, bright colors, friendly Venezuelan doctor, digital medical chart tablet, clean modern aesthetic, 1:1 aspect ratio, high resolution`
      : `Hyper-realistic 8k cinematic photograph of ${prompt}, Venezuelan medical doctor context, modern clean clinic setting, professional studio lighting, 1:1 square format`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: fullPrompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          outputMimeType: "image/png"
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Imagen 3 API HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const base64Str = data?.predictions?.[0]?.bytesBase64;
    if (!base64Str) throw new Error("Imagen 3 bytesBase64 is undefined");
    
    return Buffer.from(base64Str, 'base64');
  } catch (error: any) {
    console.error("Error generating AI Image:", error.message || error);
    throw error;
  }
}

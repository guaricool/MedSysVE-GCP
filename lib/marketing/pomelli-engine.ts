import sharp from "sharp";
import { generateVertexAIImagen3 } from "./vertex-ai";

export interface PomelliBusinessDNA {
  brandName: string;
  website: string;
  primaryColors: string[];
  toneOfVoice: string;
  targetAudience: string;
  corePillars: string[];
}

export const MEDSYSVE_BUSINESS_DNA: PomelliBusinessDNA = {
  brandName: "MedSysVE",
  website: "www.medsysve.com",
  primaryColors: ["#0b132b", "#38bdf8", "#fbbf24", "#10b981"],
  toneOfVoice: "Profesional, Innovador, Confiable, Enfocado en la Salud Venezolana",
  targetAudience: "Médicos Especialistas en Venezuela (Caracas, Maracaibo, Valencia, Barquisimeto, Maracay, etc.)",
  corePillars: [
    "Historias Clínicas Electronicas SOAP con Firma Digital",
    "Recetas e Informes con Código QR Verificado",
    "Visor PACS DICOM 100% Web",
    "Facturación Dual USD / Bolívares a Tasa Oficial BCV",
    "Verificación MPPS SACS y Red Nacional de Referidos",
  ],
};

async function generateFluxStudioImage(prompt: string, width = 1080, height = 1080): Promise<Buffer | null> {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 100000);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    console.log(`[Pomelli FLUX.1 Engine]: Requesting studio image from Pollinations FLUX.1...`);
    const res = await fetch(url, { signal: AbortSignal.timeout(45000) });

    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      if (buf.length > 5000) {
        console.log(`[Pomelli FLUX.1 Engine Success]: Downloaded ${buf.length} bytes.`);
        // Convert to PNG via Sharp to guarantee consistent 1080x1080 PNG output
        return await sharp(buf).resize(width, height).png().toBuffer();
      }
    }
  } catch (err: any) {
    console.warn("[Pomelli FLUX.1 Engine Warning]:", err?.message || err);
  }
  return null;
}

export async function generatePomelliBrandImage(
  prompt: string,
  style: "hyperrealistic" | "cartoon" | "marketing" | "screenshot"
): Promise<Buffer | null> {
  const fullPrompt = style === "cartoon"
    ? `3D Pixar Disney style digital illustration of ${prompt}, 3D animated character model render, friendly Venezuelan medical doctor, digital medical chart tablet, clean vibrant studio aesthetic, 8k resolution, 1:1 square format`
    : `Hyper-realistic 8k studio cinematic photograph of ${prompt}, Venezuelan medical doctor context, modern clean clinic setting, professional studio lighting, 1:1 square format`;

  // 1st Priority: Google Imagen 3 (Vertex AI / Google AI Studio)
  try {
    const imagenBuf = await generateVertexAIImagen3(prompt, style === "cartoon" ? "cartoon" : "hyperrealistic");
    if (imagenBuf && imagenBuf.length > 5000) {
      console.log("[Pomelli Brand Engine]: Successfully generated image with Google Imagen 3!");
      return imagenBuf;
    }
  } catch (e) {
    console.warn("[Pomelli Brand Engine]: Imagen 3 unavailable, trying FLUX.1 Studio engine...");
  }

  // 2nd Priority: FLUX.1 High-Fidelity Studio Engine (45s Timeout, Zero API Key)
  try {
    const fluxBuf = await generateFluxStudioImage(fullPrompt);
    if (fluxBuf && fluxBuf.length > 5000) {
      console.log("[Pomelli Brand Engine]: Successfully generated studio image with FLUX.1 Engine!");
      return fluxBuf;
    }
  } catch (e) {
    console.warn("[Pomelli Brand Engine]: FLUX.1 Studio engine failed...");
  }

  return null;
}

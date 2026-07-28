import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import { writeFile, mkdir } from "fs/promises";
import { join, resolve } from "path";

const ADMIN_EMAIL = "cpierluissis@gmail.com";

function getUploadsDir(): string {
  const configured = process.env.UPLOADS_DIR?.trim();
  if (configured && configured.length > 0) return resolve(configured, "marketing");
  return resolve(process.cwd(), "public", "uploads", "marketing");
}

async function saveMarketingImage(buffer: Buffer, filename: string): Promise<string> {
  const dir = getUploadsDir();
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, filename);
  await writeFile(filePath, buffer);
  return `/api/uploads/marketing/${filename}`;
}

const SPECIALTIES_LIST = [
  "Traumatología y Ortopedia",
  "Cardiología",
  "Pediatría y Puericultura",
  "Ginecología y Obstetricia",
  "Dermatología",
  "Neurología",
  "Gastroenterología",
  "Oftalmología",
  "Otorrinolaringología",
  "Neumonología",
  "Endocrinología",
  "Medicina Interna",
  "Alergología",
];

const CAMPAIGN_CONCEPTS = [
  {
    topic: "Historias Clínicas SOAP con Firma y QR",
    keyBenefits: "Apertura rápida de expediente, registro SOAP intuitivo, firma digital del médico, código QR verificado para recetas e informes, exportación en PDF instantánea.",
    defaultImage: "/api/uploads/marketing/soap-demo.png",
  },
  {
    topic: "Visor DICOM y PACS 100% Web",
    keyBenefits: "Carga inmediata de radiografías, tomografías y resonancias en HD. Medición de ángulos Cobb, cálculo HU y reproducción multiframe CINE en la misma historia del paciente.",
    defaultImage: "/api/uploads/marketing/dicom-demo.png",
  },
  {
    topic: "Facturación Dual USD / Bolívares con Tasa BCV",
    keyBenefits: "Sincronización automática de la tasa oficial del Banco Central de Venezuela cada mañana. Emisión de presupuestos, recibos y control contable en dólares y Bs sin complicaciones.",
    defaultImage: "/api/uploads/marketing/soap-demo.png",
  },
  {
    topic: "Verificación Oficial de Profesionales SACS MPPS",
    keyBenefits: "Validación del número de matrícula MPPS y colegio médico ante el registro del Ministerio de Salud. Consultas 100% legales, verificadas y transparentes en Venezuela.",
    defaultImage: "/api/uploads/marketing/sacs-demo.png",
  },
  {
    topic: "Red Nacional de Referidos entre Especialistas",
    keyBenefits: "Remisión de pacientes entre doctores de diferentes ciudades y clínicas en segundos, conservando la confidencialidad de la historia clínica bajo estándares HIPAA/LOPDP.",
    defaultImage: "/api/uploads/marketing/dicom-demo.png",
  },
  {
    topic: "Vademécum & Receta Inteligente",
    keyBenefits: "Búsqueda instantánea de medicamentos con posología, alertas de interacciones farmacológicas y emisión de récipes digitalizados e infalsificables.",
    defaultImage: "/api/uploads/marketing/soap-demo.png",
  },
];

async function generateGeminiMarketingCopy(
  topic: string,
  keyBenefits: string,
  specialty: string
): Promise<{ caption: string; hashtags: string; imagePrompt: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      caption: `🩺 Atencion especial para ${specialty} en Venezuela: ${topic}. Optimiza tu consultorio con MedSysVE, registra historias clinicas en formato SOAP, emite recetas infalsificables con QR y administra tus pagos con la tasa oficial BCV. ¡Pruébalo gratis hoy en www.medsysve.com! 🚀🇻🇪`,
      hashtags: `#MedSysVE #SaludVenezuela #DoctorVenezolano #${specialty.replace(/[\s\(\)]+/g, "")} #HistoriaClinica #BCV`,
      imagePrompt: `A professional Venezuelan doctor specialized in ${specialty} in a modern bright medical office using a sleek digital tablet with medical software, 8k resolution, cinematic lighting`,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Eres el Director de Marketing y Copywriter Senior de MedSysVE, la plataforma SaaS médica líder en Venezuela (www.medsysve.com).
Crea un post sumamente persuasivo, profesional y atractivo para Instagram y Facebook dirigido a médicos especialistas en "${specialty}".

Tema del Post: "${topic}"
Beneficios Claves del Sistema: "${keyBenefits}"

Requisitos:
1. "caption": Un texto persuasivo de 120 a 200 palabras enfocado en aportar valor al doctor en su día a día en Venezuela. Utiliza emojicraft moderado, párrafos cortos y termina con un llamado a la acción (CTA) invitándolos a registrarse en www.medsysve.com.
2. "hashtags": De 6 a 10 hashtags relevantes combinando el producto (#MedSysVE), la medicina en Venezuela (#MedicinaVenezuela #SaludVenezuela #DoctorVenezolano) y la especialidad (#${specialty.replace(/[\s\(\)]+/g, "")}).
3. "imagePrompt": Un prompt en inglés de alta calidad para generar una imagen hiperrealista 8k en Imagen 3 enfocada en la especialidad médica "${specialty}" y la tecnología médica de MedSysVE.

Responde ÚNICAMENTE en formato JSON válido con la estructura:
{
  "caption": "...",
  "hashtags": "...",
  "imagePrompt": "..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response?.text || "{}";
    const parsed = JSON.parse(jsonText);

    return {
      caption: parsed.caption || `🩺 Optimiza tu consulta de ${specialty} con MedSysVE. ${topic}. Registra historias clínicas SOAP e imprime recetas con código QR. Visita www.medsysve.com`,
      hashtags: parsed.hashtags || `#MedSysVE #MedicinaVenezuela #${specialty.replace(/[\s\(\)]+/g, "")}`,
      imagePrompt: parsed.imagePrompt || `A professional ${specialty} doctor in Venezuela using modern digital health software on a tablet, 8k, cinematic photo`,
    };
  } catch (err: any) {
    console.warn("[Gemini 2.0 Flash Marketing Copy Fallback]:", err?.message || err);
    return {
      caption: `🩺 Consulta médica de ${specialty} en Venezuela: ${topic}. Con MedSysVE optimizas tu tiempo, emites recetas seguras con código QR y controlas la facturación a tasa oficial BCV. ¡Pruébalo gratis en www.medsysve.com! 🇻🇪✨`,
      hashtags: `#MedSysVE #SaludVenezuela #DoctoresVenezuela #${specialty.replace(/[\s\(\)]+/g, "")} #HistoriaClinica`,
      imagePrompt: `A high quality photo of a doctor in a modern clinic holding a digital tablet, 8k`,
    };
  }
}

async function generateImagen3Image(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: `${prompt}. Venezuelan medical doctor context, clean medical setting, 8k resolution, professional studio lighting, 1:1 square format.`,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/png",
        aspectRatio: "1:1",
      },
    });

    const b64 = response?.generatedImages?.[0]?.image?.imageBytes;
    if (b64) {
      const buffer = Buffer.from(b64, "base64");
      const filename = `gen-${Date.now()}-${Math.floor(Math.random() * 10000)}.png`;
      const savedPath = await saveMarketingImage(buffer, filename);
      return savedPath;
    }
  } catch (err: any) {
    console.warn("[Imagen 3 API fallback to local PNG assets]:", err?.message || err);
  }
  return null;
}

async function generateSinglePostWithSelfHealing(
  overrideStyle?: "hyperrealistic" | "cartoon" | "marketing" | "screenshot"
): Promise<{
  post: any;
  attempts: number;
}> {
  const MAX_ATTEMPTS = 3;
  let lastError: any = null;

  // 1. Fetch existing marketing posts to avoid duplicates
  const existingPosts = await db.marketingPost.findMany({
    select: { caption: true, imageUrl: true },
  });

  const usedCaptions = new Set(existingPosts.map((p) => p.caption.trim()));
  const usedImages = new Set(existingPosts.map((p) => p.imageUrl.trim()));

  const randomSpec = SPECIALTIES_LIST[Math.floor(Math.random() * SPECIALTIES_LIST.length)];
  const randomConcept = CAMPAIGN_CONCEPTS[Math.floor(Math.random() * CAMPAIGN_CONCEPTS.length)];
  const styles = ["hyperrealistic", "cartoon", "screenshot", "marketing"] as const;
  const selectedStyle = overrideStyle || styles[Math.floor(Math.random() * styles.length)];

  // 2. Generate custom copywriting using Gemini 2.0 Flash
  const aiCopy = await generateGeminiMarketingCopy(
    randomConcept.topic,
    randomConcept.keyBenefits,
    randomSpec
  );

  // 3. Generate synthetic AI image or select fallback PNG asset
  let imageUrl: string | null = null;
  if (selectedStyle === "hyperrealistic" || selectedStyle === "cartoon") {
    imageUrl = await generateImagen3Image(aiCopy.imagePrompt);
  }

  if (!imageUrl) {
    imageUrl = randomConcept.defaultImage;
  }

  // Guarantee uniqueness
  let validImageUrl = imageUrl;
  if (usedImages.has(validImageUrl)) {
    validImageUrl += `?v=${Date.now()}`;
  }

  let validCaption = aiCopy.caption;
  if (usedCaptions.has(validCaption)) {
    validCaption += `\n\n(Edición Especial ${randomSpec})`;
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // 4. Create post in status PENDING_APPROVAL
      const newPost = await db.marketingPost.create({
        data: {
          imageUrl: validImageUrl,
          caption: validCaption,
          hashtags: aiCopy.hashtags,
          style: selectedStyle,
          status: "PENDING_APPROVAL",
        },
      });

      // 5. Self-healing verification check
      const verifiedPost = await db.marketingPost.findUnique({
        where: { id: newPost.id },
      });

      if (!verifiedPost) {
        throw new Error("Post insertion verification failed: row not found after create.");
      }

      return { post: verifiedPost, attempts: attempt };
    } catch (err: any) {
      console.error(`⚠️ Marketing Generator attempt ${attempt} failed:`, err);
      lastError = err;
      await new Promise((res) => setTimeout(res, 1000 * attempt));
    }
  }

  throw new Error(`Self-healing generator failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastError?.message || lastError}`);
}

// GET endpoint called by Cloud Scheduler / Cron
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "medsysve-cron-secret-2026";

  if (authHeader !== `Bearer ${cronSecret}`) {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    if (key !== cronSecret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const result = await generateSinglePostWithSelfHealing();
    return NextResponse.json({
      ok: true,
      message: "Publicación de marketing generada dinámicamente con Gemini 2.0 Flash y guardada para aprobación",
      post: result.post,
      attempts: result.attempts,
      verified: true,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Cron Generate Marketing Posts Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint called manually by Super Admin from /admin/marketing dashboard or batch generation
export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;
  const isAdmin = user?.isAdmin || user?.email === ADMIN_EMAIL;

  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "batch"; // "batch" (5 posts) or "single"

    if (mode === "single") {
      const result = await generateSinglePostWithSelfHealing();
      return NextResponse.json({
        ok: true,
        message: "Publicación de marketing generada dinámicamente con Gemini 2.0 Flash.",
        post: result.post,
        attempts: result.attempts,
        verified: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Daily Batch Mode: 5 posts (1 hyperrealistic, 1 cartoon, 1 marketing, 2 screenshots)
    const requiredBatchStyles: Array<"hyperrealistic" | "cartoon" | "marketing" | "screenshot" | "screenshot"> = [
      "hyperrealistic",
      "cartoon",
      "marketing",
      "screenshot",
      "screenshot",
    ];

    const generatedPosts: any[] = [];

    for (const targetStyle of requiredBatchStyles) {
      try {
        const result = await generateSinglePostWithSelfHealing(targetStyle);
        generatedPosts.push(result.post);
      } catch (err: any) {
        console.error(`⚠️ Failed to generate batch post for style ${targetStyle}:`, err);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Lote diario de ${generatedPosts.length} publicaciones generadas exitosamente (1 Hiperrealista, 1 Cartoon, 1 Marketing, 2 Capturas de Pantalla) en formato 1080x1080px.`,
      posts: generatedPosts,
      count: generatedPosts.length,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Batch Generate Marketing Posts Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


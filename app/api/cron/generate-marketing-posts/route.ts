import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import { writeFile, mkdir } from "fs/promises";
import { join, resolve } from "path";
import { overlayMedSysVEBranding } from "@/lib/marketing/brand-overlay";
import { captureLiveSystemScreenshot } from "@/lib/marketing/screenshot-capturer";
import sharp from "sharp";

const ADMIN_EMAIL = "cpierluissis@gmail.com";
const fontStack = "'DejaVu Sans', 'Noto Sans', 'Liberation Sans', Arial, Helvetica, sans-serif";

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
  "Urología",
  "Nefrología",
  "Psiquiatría",
  "Reumatología",
];

const CAMPAIGN_CONCEPTS = [
  {
    topic: "Historias Clínicas SOAP con Firma y QR",
    keyBenefits: "Apertura rápida de expediente, registro SOAP intuitivo, firma digital del médico, código QR verificado para recetas e informes, exportación en PDF instantánea.",
  },
  {
    topic: "Visor DICOM y PACS 100% Web",
    keyBenefits: "Carga inmediata de radiografías, tomografías y resonancias en HD. Medición de ángulos Cobb, cálculo HU y reproducción multiframe CINE en la misma historia del paciente.",
  },
  {
    topic: "Facturación Dual USD / Bolívares con Tasa BCV",
    keyBenefits: "Sincronización automática de la tasa oficial del Banco Central de Venezuela cada mañana. Emisión de presupuestos, recibos y control contable en dólares y Bs sin complicaciones.",
  },
  {
    topic: "Verificación Oficial de Profesionales SACS MPPS",
    keyBenefits: "Validación del número de matrícula MPPS y colegio médico ante el registro del Ministerio de Salud. Consultas 100% legales, verificadas y transparentes en Venezuela.",
  },
  {
    topic: "Red Nacional de Referidos entre Especialistas",
    keyBenefits: "Remisión de pacientes entre doctores de diferentes ciudades y clínicas en segundos, conservando la confidencialidad de la historia clínica bajo estándares HIPAA/LOPDP.",
  },
  {
    topic: "Vademécum & Receta Inteligente",
    keyBenefits: "Búsqueda instantánea de medicamentos con posología, alertas de interacciones farmacológicas y emisión de récipes digitalizados e infalsificables.",
  },
];

async function generateGeminiMarketingCopy(
  topic: string,
  keyBenefits: string,
  specialty: string
): Promise<{ caption: string; hashtags: string; imagePrompt: string }> {
  const apiKey = await getSecret("GEMINI_API_KEY");

  if (!apiKey) {
    return {
      caption: `🩺 Atención especial para ${specialty} en Venezuela: ${topic}. Optimiza tu consultorio con MedSysVE, registra historias clínicas en formato SOAP, emite recetas infalsificables con QR y administra tus pagos con la tasa oficial BCV. ¡Pruébalo gratis hoy en www.medsysve.com! 🚀🇻🇪`,
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
3. "imagePrompt": Un prompt detallado en inglés para generar una imagen cuadrada 1:1 en Imagen 3 enfocada en la especialidad médica "${specialty}" y la tecnología médica de MedSysVE.

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

async function generateImagen3Image(prompt: string, style: "hyperrealistic" | "cartoon"): Promise<Buffer | null> {
  const apiKey = await getSecret("GEMINI_API_KEY");
  if (!apiKey) {
    console.warn("[Imagen 3 API]: GEMINI_API_KEY not found in process.env or Secret Manager.");
    return null;
  }

  try {
    const fullPrompt = style === "cartoon"
      ? `3D Pixar Disney style digital illustration of ${prompt}, bright vibrant colors, friendly Venezuelan medical doctor, digital medical chart tablet, clean modern aesthetic, 1:1 aspect ratio, high resolution`
      : `Hyper-realistic 8k cinematic photograph of ${prompt}, Venezuelan medical doctor context, modern clean clinic setting, professional studio lighting, 1:1 square format`;

    const modelEndpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:predict?key=${apiKey}`,
    ];

    for (const url of modelEndpoints) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: fullPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
            outputMimeType: "image/png",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const b64 = data?.predictions?.[0]?.bytesBase64;
        if (b64) {
          return Buffer.from(b64, "base64");
        }
      } else {
        const errText = await res.text();
        console.warn(`[Imagen 3 API Error on ${url.split("?")[0]}]:`, res.status, errText);
      }
    }
  } catch (err: any) {
    console.warn("[Imagen 3 API Exception]:", err?.message || err);
  }
  return null;
}

// Generates a clean synthetic system card image buffer for fallback / marketing styles
async function generateSystemCardBuffer(specialty: string, topic: string, style: "screenshot" | "marketing"): Promise<Buffer> {
  const isScreenshot = style === "screenshot";
  
  const cardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b132b" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.98" />
    </linearGradient>

    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>

  <rect width="1080" height="1080" fill="url(#bgGrad)" />

  <!-- Grid lines background -->
  <g stroke="rgba(245, 158, 11, 0.06)" stroke-width="1">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${i * 90}" x2="1080" y2="${i * 90}" />`).join("")}
    ${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 90}" y1="0" x2="${i * 90}" y2="1080" />`).join("")}
  </g>

  <!-- Central Platform Preview Container -->
  <g transform="translate(60, 160)">
    <rect x="0" y="0" width="960" height="740" rx="28" fill="url(#cardGrad)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="2" />
    <rect x="0" y="0" width="960" height="10" rx="5" fill="url(#gold)" />

    <!-- Simulated Browser Bar if screenshot style -->
    ${isScreenshot ? `
    <rect x="30" y="30" width="900" height="54" rx="12" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1.5" />
    <circle cx="60" cy="57" r="7" fill="#ef4444" />
    <circle cx="82" cy="57" r="7" fill="#f59e0b" />
    <circle cx="104" cy="57" r="7" fill="#10b981" />
    <text x="140" y="63" font-family="${fontStack}" font-weight="700" font-size="16" fill="#38bdf8">medsysve.com/doctor/patients/encounter</text>
    <rect x="740" y="42" width="160" height="30" rx="8" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-width="1" />
    <text x="756" y="62" font-family="${fontStack}" font-weight="800" font-size="13" fill="#fbbf24">✓ SOAP EN VIVO</text>
    ` : `
    <rect x="30" y="30" width="900" height="54" rx="12" fill="rgba(245, 158, 11, 0.12)" stroke="rgba(245, 158, 11, 0.4)" stroke-width="1.5" />
    <text x="50" y="64" font-family="${fontStack}" font-weight="800" font-size="18" fill="#fbbf24" letter-spacing="1">🩺 CONSULTA DE ${specialty.toUpperCase()}</text>
    `}

    <!-- Content Preview Elements -->
    <g transform="translate(40, 120)">
      <rect x="0" y="0" width="420" height="240" rx="16" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(245, 158, 11, 0.2)" stroke-width="1.5" />
      <text x="25" y="45" font-family="${fontStack}" font-weight="800" font-size="20" fill="#fbbf24">📝 HISTORIA CLÍNICA SOAP</text>
      <text x="25" y="90" font-family="${fontStack}" font-weight="500" font-size="15" fill="#cbd5e1">Subjetivo: Paciente acude a control de ${specialty}.</text>
      <text x="25" y="125" font-family="${fontStack}" font-weight="500" font-size="15" fill="#cbd5e1">Objetivo: Signos vitales estables. FC: 72 bpm.</text>
      <text x="25" y="160" font-family="${fontStack}" font-weight="500" font-size="15" fill="#cbd5e1">Plan: Esquema farmacológico verificado BCV.</text>
      <rect x="25" y="185" width="200" height="34" rx="8" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="1" />
      <text x="40" y="207" font-family="${fontStack}" font-weight="800" font-size="13" fill="#34d399">✓ FIRMA Y QR LEGAL</text>

      <rect x="460" y="0" width="420" height="240" rx="16" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(56, 189, 248, 0.2)" stroke-width="1.5" />
      <text x="485" y="45" font-family="${fontStack}" font-weight="800" font-size="20" fill="#38bdf8">📊 VISOR DICOM &amp; PACS</text>
      <text x="485" y="90" font-family="${fontStack}" font-weight="500" font-size="15" fill="#cbd5e1">Estudio HD CINE Multiframe</text>
      <text x="485" y="125" font-family="${fontStack}" font-weight="500" font-size="15" fill="#cbd5e1">Medición de Ángulos Cobb &amp; HU</text>
      <text x="485" y="160" font-family="${fontStack}" font-weight="500" font-size="15" fill="#cbd5e1">Integración 100% Web sin descargas</text>
      <rect x="485" y="185" width="220" height="34" rx="8" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1" />
      <text x="500" y="207" font-family="${fontStack}" font-weight="800" font-size="13" fill="#38bdf8">✓ PACS NUBE ACTIVO</text>

      <!-- Bottom Pillar Cards -->
      <g transform="translate(0, 270)">
        <rect x="0" y="0" width="270" height="110" rx="14" fill="rgba(245, 158, 11, 0.1)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1.5" />
        <text x="20" y="40" font-family="${fontStack}" font-weight="800" font-size="16" fill="#fbbf24">💵 Tasa Oficial BCV</text>
        <text x="20" y="75" font-family="${fontStack}" font-weight="500" font-size="14" fill="#cbd5e1">Facturación USD / Bs</text>

        <rect x="305" y="0" width="270" height="110" rx="14" fill="rgba(56, 189, 248, 0.1)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1.5" />
        <text x="325" y="40" font-family="${fontStack}" font-weight="800" font-size="16" fill="#38bdf8">🛡️ Validación SACS</text>
        <text x="325" y="75" font-family="${fontStack}" font-weight="500" font-size="14" fill="#cbd5e1">Matrícula MPPS Verificada</text>

        <rect x="610" y="0" width="270" height="110" rx="14" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.3)" stroke-width="1.5" />
        <text x="630" y="40" font-family="${fontStack}" font-weight="800" font-size="16" fill="#34d399">🤝 Red Referidos</text>
        <text x="630" y="75" font-family="${fontStack}" font-weight="500" font-size="14" fill="#cbd5e1">Interconsulta Segura</text>
      </g>
    </g>
  </g>
</svg>
`;

  return sharp(Buffer.from(cardSvg)).png().toBuffer();
}

async function generateSinglePostWithSelfHealing(
  overrideStyle?: "hyperrealistic" | "cartoon" | "marketing" | "screenshot"
): Promise<{
  post: any;
  attempts: number;
}> {
  const MAX_ATTEMPTS = 3;
  let lastError: any = null;

  // 1. Fetch existing marketing posts to ensure strict uniqueness
  const existingPosts = await db.marketingPost.findMany({
    select: { caption: true, imageUrl: true, style: true },
  });

  const usedCaptions = new Set(existingPosts.map((p) => p.caption.trim()));

  // 2. Select unused specialty and concept
  const availableSpecialties = SPECIALTIES_LIST.filter(
    (spec) => !Array.from(usedCaptions).some((c) => c.includes(spec))
  );
  const selectedSpec = availableSpecialties.length > 0
    ? availableSpecialties[Math.floor(Math.random() * availableSpecialties.length)]
    : SPECIALTIES_LIST[Math.floor(Math.random() * SPECIALTIES_LIST.length)];

  const selectedConcept = CAMPAIGN_CONCEPTS[Math.floor(Math.random() * CAMPAIGN_CONCEPTS.length)];
  const styles = ["hyperrealistic", "cartoon", "screenshot", "marketing"] as const;
  const selectedStyle = overrideStyle || styles[Math.floor(Math.random() * styles.length)];

  // 3. Generate custom copywriting using Gemini 2.0 Flash
  const aiCopy = await generateGeminiMarketingCopy(
    selectedConcept.topic,
    selectedConcept.keyBenefits,
    selectedSpec
  );

  // 4. Generate base image buffer according to selected style
  let baseBuffer: Buffer | null = null;

  if (selectedStyle === "screenshot") {
    const baseUrl = process.env.MEDSYSVE_APP_URL || "https://www.medsysve.com";
    const botUser = (await getSecret("IG_SYSTEM_USER")) || "marketing@medsysve.com";
    const botPass = (await getSecret("IG_SYSTEM_PASS")) || "Marketing2026!";

    const shotResult = await captureLiveSystemScreenshot(baseUrl, botUser, botPass);
    if (shotResult) {
      baseBuffer = shotResult.buffer;
    }
  } else if (selectedStyle === "hyperrealistic" || selectedStyle === "cartoon") {
    baseBuffer = await generateImagen3Image(aiCopy.imagePrompt, selectedStyle);
  }

  // Fallback to system card SVG if image generation / screenshot unavailable
  if (!baseBuffer) {
    baseBuffer = await generateSystemCardBuffer(
      selectedSpec,
      selectedConcept.topic,
      selectedStyle === "screenshot" ? "screenshot" : "marketing"
    );
  }

  // 5. Apply official MedSysVE brand overlay (Logo + Badges) onto the image
  const finalBrandedBuffer = await overlayMedSysVEBranding(baseBuffer, {
    style: selectedStyle,
    specialty: selectedSpec,
    topic: selectedConcept.topic,
  });

  // 6. Save image to disk and get public URL
  const filename = `medsysve-post-${selectedStyle}-${Date.now()}-${Math.floor(Math.random() * 10000)}.png`;
  const savedImageUrl = await saveMarketingImage(finalBrandedBuffer, filename);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // 7. Create post in status PENDING_APPROVAL
      const newPost = await db.marketingPost.create({
        data: {
          imageUrl: savedImageUrl,
          caption: aiCopy.caption,
          hashtags: aiCopy.hashtags,
          style: selectedStyle,
          status: "PENDING_APPROVAL",
        },
      });

      // 8. Verification check
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
      message: "Publicación de marketing generada dinámicamente con Gemini 2.0 y marca oficial MedSysVE",
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
        message: "Publicación de marketing generada dinámicamente con Gemini 2.0 y marca oficial MedSysVE.",
        post: result.post,
        attempts: result.attempts,
        verified: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Daily Batch Mode: 5 posts (1 hyperrealistic, 1 cartoon, 1 marketing, 2 screenshots)
    const requiredBatchStyles: Array<"hyperrealistic" | "cartoon" | "marketing" | "screenshot"> = [
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
      message: `Lote diario de ${generatedPosts.length} publicaciones generadas exitosamente (1 Hiperrealista, 1 Cartoon, 1 Marketing, 2 Capturas de Pantalla) con marca oficial MedSysVE en formato 1080x1080px.`,
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

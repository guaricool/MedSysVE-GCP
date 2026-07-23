import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const ADMIN_EMAIL = "cpierluissis@gmail.com";

const CAMPAIGN_TOPICS = [
  {
    topic: "Historias Clínicas SOAP",
    style: "screenshot",
    caption: "🏥 Optimiza tu consulta médica con MedSysVE. Registra antecedentes, diagnóstico diferencial e imprime récipes oficiales en formato SOAP con código QR en menos de 2 minutos.",
    hashtags: "#MedSysVE #HistoriaClinica #MedicinaVenezuela #SaludVenezuela #DoctorVenezolano #SOAP #ExpedienteElectronico",
    imageUrl: "/uploads/marketing/soap-demo.png",
  },
  {
    topic: "Visor DICOM / PACS Web",
    style: "hyperrealistic",
    caption: "🔬 ¡Visualiza tomografías, ecografías y resonancias en HD directo en la historia clínica del paciente! MedSysVE cuenta con visor PACS 100% web con medición de ángulos Cobb y CINE multiframe.",
    hashtags: "#MedSysVE #DICOM #PACS #RadiologiaVenezuela #Traumatologia #Cardiologia #SaludDigital #Doctor",
    imageUrl: "/uploads/marketing/dicom-demo.png",
  },
  {
    topic: "Facturación Dual USD / Bs (BCV)",
    style: "marketing",
    caption: "💵 Mantén la contabilidad de tu consultorio al día. MedSysVE sincroniza automáticamente la tasa oficial del Banco Central de Venezuela (BCV) cada mañana para facturar en dólares y bolívares.",
    hashtags: "#MedSysVE #FacturacionSENIAT #BCV #SaaSMedico #ConsultorioMedico #Venezuela #Salud",
    imageUrl: "/uploads/marketing/soap-demo.png",
  },
  {
    topic: "Verificación Oficial SACS MPPS",
    style: "marketing",
    caption: "🛡️ En MedSysVE cuidamos la salud de Venezuela. Todos los médicos en nuestra plataforma son validados ante el Registro del Ministerio de Salud (SACS MPPS). ¡Garantía de consultas 100% verificadas! 🩺🇻🇪",
    hashtags: "#MedSysVE #SACS #MPPS #DoctorVerificado #SaludVenezuela #MedicinaVenezuela #ConsultasSeguras",
    imageUrl: "/uploads/marketing/sacs-demo.png",
  },
  {
    topic: "Red de Referidos & Interconsulta",
    style: "cartoon",
    caption: "🤝 Conecta tu consultorio con médicos de todo el país. Remite pacientes entre especialidades en segundos conservando la trazabilidad clínica y la confidencialidad de la historia.",
    hashtags: "#MedSysVE #RedDeReferidos #DoctoresVenezuela #SaludDigital #EspecialistasMedicos #Interconsulta",
    imageUrl: "/uploads/marketing/dicom-demo.png",
  },
  {
    topic: "Vademécum & Recetas Inteligentes",
    style: "screenshot",
    caption: "💊 Emite recetas claras, seguras e infalsificables. Accede al vademécum en tiempo real, verifica interacciones farmacológicas y firma tus prescripciones digitalmente.",
    hashtags: "#MedSysVE #Vademecum #RecetasMedicas #Farmacologia #DoctoresVenezuela #Salud",
    imageUrl: "/uploads/marketing/soap-demo.png",
  },
  {
    topic: "Consentimientos Informados Digitales",
    style: "hyperrealistic",
    caption: "📜 Resguarda tu responsabilidad profesional. Firma y haz firmar a tus pacientes consentimientos informados digitales con valor legal y resguardo cifrado HIPAA/LOPDP.",
    hashtags: "#MedSysVE #DerechoMedico #ConsentimientoInformado #LOPDP #MedicinaLegal #Venezuela",
    imageUrl: "/uploads/marketing/sacs-demo.png",
  },
  {
    topic: "Gestión de Citas & Sala de Espera",
    style: "cartoon",
    caption: "⏰ Reduce ausencias y organiza tu día. Ofrece agendamiento online a tus pacientes y gestiona tu sala de espera en tiempo real desde tu laptop o teléfono.",
    hashtags: "#MedSysVE #AgendaMedica #SalaDeEspera #CitasMedicas #DoctorVenezolano #SaludDigital",
    imageUrl: "/uploads/marketing/soap-demo.png",
  },
];

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
];

async function generateSinglePostWithSelfHealing(): Promise<{
  post: any;
  attempts: number;
}> {
  const MAX_ATTEMPTS = 3;
  let lastError: any = null;

  // 1. Fetch recent marketing posts to ensure NO duplicate captions or images
  const existingPosts = await db.marketingPost.findMany({
    take: 50,
    orderBy: { publishedAt: "desc" },
    select: { caption: true, imageUrl: true, style: true },
  });

  const existingCaptions = new Set(existingPosts.map((p) => p.caption.trim()));

  // 2. Filter candidate topics to find unused topics
  let availableTopics = CAMPAIGN_TOPICS.filter((t) => !existingCaptions.has(t.caption.trim()));

  let selectedTopic: {
    topic: string;
    style: string;
    caption: string;
    hashtags: string;
    imageUrl: string;
  };

  if (availableTopics.length > 0) {
    // Pick an unused topic
    const topicIndex = Math.floor(Math.random() * availableTopics.length);
    selectedTopic = availableTopics[topicIndex];
  } else {
    // If all base topics have been generated, create a FRESH unique variation incorporating a specialty
    const randomSpec = SPECIALTIES_LIST[Math.floor(Math.random() * SPECIALTIES_LIST.length)];
    const randomBase = CAMPAIGN_TOPICS[Math.floor(Math.random() * CAMPAIGN_TOPICS.length)];

    selectedTopic = {
      topic: `${randomBase.topic} (${randomSpec})`,
      style: randomBase.style || "hyperrealistic",
      caption: `🩺 Atenci\u00f3n especial de ${randomSpec} en Venezuela: ${randomBase.caption} Adapta la plataforma a las necesidades particulares de tu especialidad.`,
      hashtags: `${randomBase.hashtags} #${randomSpec.replace(/\s+/g, "")}`,
      imageUrl: randomBase.imageUrl || "/uploads/marketing/soap-demo.png",
    };
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const validImageUrl = selectedTopic.imageUrl || "/uploads/marketing/soap-demo.png";

      // 3. Insert post in status PENDING_APPROVAL
      const newPost = await db.marketingPost.create({
        data: {
          imageUrl: validImageUrl,
          caption: selectedTopic.caption,
          hashtags: selectedTopic.hashtags,
          style: selectedTopic.style || "hyperrealistic",
          status: "PENDING_APPROVAL",
        },
      });

      // 4. Self-Healing Verification Check: Verify insertion in DB
      const verifiedPost = await db.marketingPost.findUnique({
        where: { id: newPost.id },
      });

      if (!verifiedPost) {
        throw new Error("Post insertion verification failed: row not found after create.");
      }

      // Success! Return generated post
      return { post: verifiedPost, attempts: attempt };
    } catch (err: any) {
      console.error(`⚠️ Marketing Generator attempt ${attempt} failed:`, err);
      lastError = err;
      await new Promise((res) => setTimeout(res, 1000 * attempt));
    }
  }

  throw new Error(`Self-healing generator failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastError?.message || lastError}`);
}

// GET endpoint called by Cloud Scheduler / Cron (6 times daily)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "medsysve-cron-secret-2026";

  if (authHeader !== `Bearer ${cronSecret}`) {
    // Also allow manual query parameter for internal cron testing
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
      message: "Publicación de marketing generada y enviada a la bandeja de aprobación del Super Admin",
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

// POST endpoint called manually by Super Admin from /admin/marketing dashboard
export async function POST() {
  const session = await auth();
  const user = session?.user as any;
  const isAdmin = user?.isAdmin || user?.email === ADMIN_EMAIL;

  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const result = await generateSinglePostWithSelfHealing();
    return NextResponse.json({
      ok: true,
      message: "Publicación de marketing generada exitosamente con auto-recuperación de errores.",
      post: result.post,
      attempts: result.attempts,
      verified: true,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Manual Generate Marketing Post Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

import { GoogleGenAI, Type, Tool, Content, Part } from "@google/genai"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { audit } from "@/lib/audit"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { safeLog } from "@/lib/log-sanitizer"
import { isAIFeatureEnabled } from "@/lib/feature-flags"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ============================================================================
// AI Support Bot — read-only.
//
// Carlos quiere un bot que:
//  - Responda preguntas frecuentes (planes, errores, docs).
//  - NO acceda a PHI de pacientes ajenos al workspace del doctor que pregunta.
//  - NO pueda modificar datos del sistema (read-only).
//  - Registre cada interacción en AuditEvent con channel="SUPPORT_BOT".
//
// Tool set (todas read-only):
//  - getBillingStatus  : plan actual + facturas recientes del workspace.
//  - getWorkspaceInfo  : datos del consultorio (no clínicos).
//  - getSystemStatus   : estado de salud del sistema (DB ping).
//  - searchDocs        : busca en los documentos legales publicados.
//  - getCommonErrors   : lista de errores frecuentes y su significado.
//
// Guardrail: cada tool recibe el ctx.session (workspaceId + doctorId).
// Cualquier intento del modelo de leer datos fuera de su workspace
// es rechazado a nivel del handler.
// ============================================================================

interface SupportContext {
  doctorId: string
  workspaceId: string
  doctorName: string
  doctorEmail: string
}

async function captureSupportContext(): Promise<SupportContext & { ip: string; userAgent: string | null }> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("UNAUTHORIZED")
  }
  const hdrs = await headers()
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown"
  return {
    doctorId: session.user.doctorId,
    workspaceId: session.user.workspaceId,
    doctorName: `${session.user.nombre} ${session.user.apellido}`,
    doctorEmail: session.user.email,
    ip: ip.includes(":")
      ? ip.split(":").slice(0, 3).join(":") + ":0:0:0:0:0"
      : (() => {
          const p = ip.split(".")
          return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0` : ip
        })(),
    userAgent: hdrs.get("user-agent") ?? null,
  }
}

// ---------------------------------------------------------------------------
// Tool implementations. Strict: never cross workspaceId boundary.
// ---------------------------------------------------------------------------

async function toolGetBillingStatus(ctx: SupportContext) {
  const [doctor, recentInvoices] = await Promise.all([
    db.doctor.findUnique({
      where: { id: ctx.doctorId },
      select: { plan: true },
    }),
    db.invoice.findMany({
      where: { workspaceId: ctx.workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        numero: true,
        montoUsd: true,
        status: true,
        createdAt: true,
      },
    }),
  ])
  return {
    plan: doctor?.plan ?? "free",
    recentInvoices,
    note:
      doctor?.plan === "premium"
        ? "Tu cuenta es Premium. Si necesitas funciones nuevas, escríbenos a yoguitech@gmail.com."
        : "Estás en plan Free. Para actualizar a Premium contáctanos a yoguitech@gmail.com.",
  }
}

async function toolGetWorkspaceInfo(ctx: SupportContext) {
  return db.workspace.findUnique({
    where: { id: ctx.workspaceId },
    select: {
      id: true,
      nombre: true,
      direccion: true,
      telefono: true,
      recordatorioHoras: true,
      recordatorioWa: true,
      recordatorioEmail: true,
      clinic: { select: { nombre: true, slug: true, logoUrl: true } },
    },
  })
}

async function toolGetSystemStatus() {
  const started = Date.now()
  try {
    await db.$queryRaw`SELECT 1`
    return {
      database: "ok",
      api: "ok",
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    }
  } catch (err) {
    return {
      database: "down",
      api: "ok",
      error: err instanceof Error ? err.message : "unknown",
      timestamp: new Date().toISOString(),
    }
  }
}

async function toolSearchDocs(query: string) {
  // Read the four published legal docs from disk.
  const slugs = ["terminos", "privacidad", "cookies", "lopdp-consentimiento"] as const
  const matches: Array<{ slug: string; excerpt: string; score: number }> = []
  for (const slug of slugs) {
    try {
      const fs = await import("fs/promises")
      const path = (await import("path")).join(process.cwd(), "content", "legal", `${slug}.md`)
      const source = await fs.readFile(path, "utf8")
      const lower = source.toLowerCase()
      const queryLower = query.toLowerCase()
      const idx = lower.indexOf(queryLower)
      if (idx !== -1) {
        const start = Math.max(0, idx - 80)
        const end = Math.min(source.length, idx + 200)
        const excerpt = (start > 0 ? "…" : "") + source.slice(start, end).trim() + (end < source.length ? "…" : "")
        matches.push({ slug, excerpt, score: 1 })
      }
    } catch {
      // skip
    }
  }
  return matches.length > 0 ? matches : [{ slug: "ninguno", excerpt: "No se encontró coincidencia.", score: 0 }]
}

const COMMON_ERRORS: Array<{ code: string; meaning: string; fix: string }> = [
  {
    code: "P2002",
    meaning: "Conflicto de unicidad (cédula o email ya registrado)",
    fix: "Verifica que la cédula y el email no estén ya registrados.",
  },
  {
    code: "UNAUTHORIZED",
    meaning: "Sesión inválida o expirada",
    fix: "Cierra sesión y vuelve a iniciar.",
  },
  {
    code: "FORBIDDEN",
    meaning: "No tienes permisos para esta acción",
    fix: "Solicita el permiso al administrador del workspace.",
  },
  {
    code: "TOO_MANY_REQUESTS",
    meaning: "Demasiadas solicitudes",
    fix: "Espera unos minutos e inténtalo de nuevo.",
  },
  {
    code: "BAD_REQUEST / ZodError",
    meaning: "Datos enviados no cumplen el esquema",
    fix: "Revisa los campos obligatorios y formatos (email, cédula, etc.).",
  },
]

async function toolGetCommonErrors() {
  return COMMON_ERRORS
}

// ---------------------------------------------------------------------------
// Anthropic tool definitions (sent to the model).
// ---------------------------------------------------------------------------

const SUPPORT_BOT_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "getBillingStatus",
        description: "Returns the current plan and the 5 most recent invoices for the doctor's own workspace. Read-only."
      },
      {
        name: "getWorkspaceInfo",
        description: "Returns the doctor's own workspace info (name, address, clinic). Never returns data from other workspaces."
      },
      {
        name: "getSystemStatus",
        description: "Pings the database and reports API + DB health. Read-only."
      },
      {
        name: "searchDocs",
        description: "Searches the published legal documents (Términos, Privacidad, Cookies, LOPDP). Read-only.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Search query in Spanish" },
          },
          required: ["query"],
        },
      },
      {
        name: "getCommonErrors",
        description: "Returns a list of common error codes with their meaning and how to fix them. Read-only."
      }
    ]
  }
]

async function dispatchTool(name: string, input: Record<string, unknown>, ctx: SupportContext) {
  switch (name) {
    case "getBillingStatus":
      return toolGetBillingStatus(ctx)
    case "getWorkspaceInfo":
      return toolGetWorkspaceInfo(ctx)
    case "getSystemStatus":
      return toolGetSystemStatus()
    case "searchDocs":
      return toolSearchDocs(String(input.query ?? ""))
    case "getCommonErrors":
      return toolGetCommonErrors()
    default:
      throw new Error(`Tool ${name} not available (read-only bot)`)
  }
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Eres el asistente de soporte de MedSysVE, plataforma médica operada por Yoguitech.LLC en Venezuela.

Tu ÚNICO alcance de respuesta es:

EN ALCANCE — responde con confianza usando herramientas cuando aplique:
1. La plataforma MedSysVE en sí: cómo usar funciones, dónde encontrar pantallas, flujos clínicos, atajos.
2. Errores técnicos: explica códigos (P2002, ZodError, etc.) y pasos de diagnóstico.
3. El plan y facturación del workspace del doctor que te habla (usa getBillingStatus).
4. Configuración del workspace propio (usa getWorkspaceInfo): recordatorios, dirección, clínica asociada.
5. Documentos legales publicados: Términos, Privacidad, Cookies, LOPDP (usa searchDocs).
6. Estado de salud del sistema (usa getSystemStatus).

FUERA DE ALCANCE — RECHAZA siempre con esta plantilla exacta:
"Solo puedo responder preguntas sobre MedSysVE y tu cuenta. Para [tema del usuario], te recomiendo escribir a yoguitech@gmail.com."
Aplica para, sin limitarse a:
- Conocimiento general (historia, ciencia, geografía, definiciones, traducciones).
- Otras plataformas o competidores (cuéntame de X app, ¿cómo uso Y sistema?).
- Política, religión, noticias, opinión.
- Entretenimiento (chistes, recetas de cocina, deportes, películas).
- Programación genérica o tareas técnicas que no sean del sistema (escribe código en Python, depura mi SQL).
- Cualquier tema médico o clínico concreto (síntomas, diagnósticos, dosis). El sistema NO reemplaza consejo médico profesional; el bot NO da consejo clínico.
- Consultoría legal/fiscal/contable.

Reglas duras (NUNCA rompas):
- NUNCA reveles, accedas, ni menciones información de pacientes (PHI). Si preguntan por un paciente específico: "Por privacidad no tengo acceso a datos de pacientes. Para temas clínicos, contacta directamente al paciente o a yoguitech@gmail.com."
- NUNCA modifiques datos. Solo lectura con las herramientas disponibles.
- NUNCA reveles datos de OTROS workspaces. Solo el workspace del doctor que te habla.
- Si una pregunta es ambigua entre EN ALCANCE y FUERA, interprétala en el sentido más cercano a MedSysVE. Si todavía no puedes, pide aclaración corta antes de responder.

Estilo:
- Responde en español, con calidez, 2-3 párrafos cortos como máximo.
- Si el usuario describe un problema técnico, pregunta primero: texto exacto del error, qué estaba haciendo, desde qué dispositivo.`

export async function POST(req: Request) {
  let ctx: SupportContext & { ip: string; userAgent: string | null }
  try {
    ctx = await captureSupportContext()
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  // Feature flag: AI features can be globally disabled or rolled out
  // gradually per-user. See lib/feature-flags.ts and docs/FEATURE_FLAGS.md.
  const aiSession = await auth()
  if (!isAIFeatureEnabled(aiSession)) {
    return NextResponse.json(
      { error: "Bot temporalmente deshabilitado" },
      { status: 503 },
    )
  }

  const body = (await req.json().catch(() => null)) as
    | { messages?: Array<{ role: "user" | "assistant"; content: string }> }
    | null

  if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 })
  }

  // Clamp to last 20 messages to bound cost.
  const messages = body.messages.slice(-20)

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Bot no configurado: define GEMINI_API_KEY" },
      { status: 503 },
    )
  }

  const ai = new GoogleGenAI({ apiKey })

  const conversationMessages: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const toolCalls: Array<{ tool: string; input: unknown; result: unknown }> = []
  for (let iter = 0; iter < 4; iter++) {
    let response: any
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: conversationMessages,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: SUPPORT_BOT_TOOLS,
          maxOutputTokens: 800,
        }
      })
    } catch (err) {
      safeLog("error", "support_bot.gemini_error", {
        doctorId: ctx.doctorId,
        workspaceId: ctx.workspaceId,
        iter,
        messageCount: messages.length,
        errorName: err instanceof Error ? err.name : "unknown",
        errorMessage: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      })
      return NextResponse.json(
        { error: "Bot temporalmente no disponible. Intenta de nuevo o escribe a yoguitech@gmail.com." },
        { status: 502 },
      )
    }

    const toolUseBlocks = response.functionCalls || []

    if (toolUseBlocks.length === 0) {
      const text = response.text || ""

      await audit("AI_PHI_DISCLOSURE", {
        workspaceId: ctx.workspaceId,
        userId: ctx.doctorId,
        userRole: "DOCTOR",
        resourceType: "SupportBot",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        channel: "SUPPORT_BOT",
        outcome: "ALLOWED",
        metadata: {
          toolsCalled: toolCalls.map((tc) => tc.tool),
          messageCount: messages.length,
        },
      })

      return NextResponse.json({ reply: text, toolsCalled: toolCalls.map((tc) => tc.tool) })
    }

    const candidateContent = response.candidates?.[0]?.content
    if (candidateContent) {
      conversationMessages.push(candidateContent)
    }

    const toolResults: Part[] = []
    for (const block of toolUseBlocks) {
      try {
        const result = await dispatchTool(block.name, block.args as Record<string, unknown>, ctx)
        toolCalls.push({ tool: block.name, input: block.args, result })
        toolResults.push({
          functionResponse: {
            name: block.name,
            response: result as Record<string, unknown>
          }
        })
      } catch (err) {
        toolResults.push({
          functionResponse: {
            name: block.name,
            response: { error: err instanceof Error ? err.message : "tool_error" }
          }
        })
      }
    }

    conversationMessages.push({ role: "user", parts: toolResults })
  }

  return NextResponse.json(
    { error: "Bot excedió el límite de iteraciones, intenta reformular tu pregunta." },
    { status: 500 },
  )
}
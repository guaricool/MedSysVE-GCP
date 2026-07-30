import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { seedKnowledgeBase } from "@/scripts/seed-agent-knowledge"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const user = session?.user as any
    if (!user || (user.role !== "DOCTOR" && !user.isAdmin)) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
    }

    await seedKnowledgeBase()

    return NextResponse.json({
      ok: true,
      message: "Base de conocimiento para Agentes 24/7 sembrada con éxito.",
    })
  } catch (error) {
    console.error("[seed-knowledge] Error:", error)
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", details: String(error) },
      { status: 500 }
    )
  }
}

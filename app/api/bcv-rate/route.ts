import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
      next: { revalidate: 0 },
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { promedio?: number; precio?: number }
    const precio = data.promedio ?? data.precio
    if (typeof precio !== "number") throw new Error("Invalid response shape")
    return NextResponse.json({ precio })
  } catch (err) {
    return NextResponse.json(
      { error: `No se pudo obtener la tasa: ${err instanceof Error ? err.message : "error desconocido"}` },
      { status: 502 }
    )
  }
}

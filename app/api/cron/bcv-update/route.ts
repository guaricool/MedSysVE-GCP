import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let tasa: number
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", { cache: "no-store" })
    if (!res.ok) throw new Error(`dolarapi responded ${res.status}`)
    const data = await res.json() as { promedio?: number; precio?: number }
    tasa = data.promedio ?? data.precio ?? 0
    if (!tasa || tasa <= 0) throw new Error("Invalid rate value")
  } catch (err) {
    return NextResponse.json({ error: "No se pudo obtener la tasa BCV", detail: String(err) }, { status: 502 })
  }

  await db.workspace.updateMany({
    data: { tasaBcvActual: tasa, tasaBcvAt: new Date() },
  })

  return NextResponse.json({ ok: true, tasa, updatedAt: new Date().toISOString() })
}

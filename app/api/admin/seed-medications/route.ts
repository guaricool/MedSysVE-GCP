import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

import { medicationsVE } from "@/prisma/data/medications-ve"
import { medicationsVEExtra } from "@/prisma/data/medications-ve-extra"
import type { SessionUser } from "@/types"

export async function POST(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as SessionUser
  if (user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Upsert all medications into Postgres
  const allSeeds = [...medicationsVE, ...medicationsVEExtra]
  let upserted = 0
  for (const m of allSeeds) {
    const seedId = `seed_${m.nombreGenerico.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`
    await db.medication.upsert({
      where: { id: seedId },
      update: {
        nombresComerciales: m.nombresComerciales,
        concentraciones: m.concentraciones,
        formaFarmaceutica: m.formaFarmaceutica,
        viaAdministracion: m.viaAdministracion,
        categoria: m.categoria,
      },
      create: {
        id: seedId,
        nombreGenerico: m.nombreGenerico,
        nombresComerciales: m.nombresComerciales,
        concentraciones: m.concentraciones,
        formaFarmaceutica: m.formaFarmaceutica,
        viaAdministracion: m.viaAdministracion,
        dosisDefaults: m.dosisDefaults ?? undefined,
        categoria: m.categoria,
        isCustom: false,
        activo: true,
      },
    })
    upserted++
  }

  return NextResponse.json({ ok: true, upserted, redisLoaded: 0 })
}

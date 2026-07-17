import { db } from "../lib/db"
import { Prisma } from "@prisma/client"

async function main() {
  console.log("Testing Prisma upsert...")
  try {
    const doctor = await db.doctor.findFirst()
    if (!doctor) {
      console.log("No doctor found")
      return
    }

    const input = {
      secciones: {
        motivoConsulta: true,
        historiaClinica: false
      },
      instruccionesDefault: {}
    }

    const instruccionesSanitized = {}
    const hasInstructions = false

    const updated = await db.doctorReportPreferences.upsert({
      where: { doctorId: doctor.id },
      create: {
        doctorId: doctor.id,
        secciones: input.secciones,
        instruccionesDefault: hasInstructions ? (instruccionesSanitized as any) : Prisma.JsonNull,
      },
      update: {
        secciones: input.secciones,
        instruccionesDefault: hasInstructions ? (instruccionesSanitized as any) : Prisma.JsonNull,
      },
    })
    console.log("Upsert successful:", updated)
  } catch (e: any) {
    console.error("Prisma error:", e.message)
    console.error("Stack:", e.stack)
  }
}

main()

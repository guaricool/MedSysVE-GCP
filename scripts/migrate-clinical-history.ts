import { db } from "../lib/db";
import { encryptField } from "../lib/field-crypto";

/**
 * Script de migración: Mover historiaClinica y plan (texto claro)
 * a historiaClinicaCifrada y planCifrado (AES-256-GCM).
 */
async function main() {
  console.log("Iniciando migración de datos clínicos a versión cifrada...");

  // Migrar Encounters
  const encounters = await db.encounter.findMany({
    where: {
      OR: [
        { historiaClinica: { not: null } },
        { plan: { not: null } },
      ],
    },
    select: { id: true, historiaClinica: true, plan: true },
  });

  console.log(`Encontrados ${encounters.length} encounters para migrar.`);
  
  for (const enc of encounters) {
    await db.encounter.update({
      where: { id: enc.id },
      data: {
        historiaClinicaCifrada: encryptField(enc.historiaClinica),
        planCifrado: encryptField(enc.plan),
        historiaClinica: null, // Purgar plaintext
        plan: null,            // Purgar plaintext
      },
    });
  }

  console.log("Migración completada exitosamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

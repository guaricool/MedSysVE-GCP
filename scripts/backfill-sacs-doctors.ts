import { db } from "../lib/db";
import { scrapeSacsMpps } from "../server/utils/sacs-scraper";

/**
 * Script de Migración / Backfill SACS MPPS:
 *
 * Recorre todos los doctores existentes en la base de datos de MedSysVE,
 * consulta sus credenciales en el portal oficial del MPPS (SACS),
 * y actualiza:
 *  - mppsMatricula
 *  - isSacsVerified
 *  - segundoNombre / segundoApellido (si aplica)
 *  - isOnboardingComplete (si ya posee RIF y Matrícula)
 */
export async function runSacsBackfill() {
  console.log("🚀 Iniciando Backfill SACS MPPS para todos los médicos existentes...");

  const doctors = await db.doctor.findMany({
    select: {
      id: true,
      cedula: true,
      nacionalidad: true,
      nombre: true,
      segundoNombre: true,
      apellido: true,
      segundoApellido: true,
      mppsMatricula: true,
      rif: true,
      especialidadPrincipal: true,
      isSacsVerified: true,
      isOnboardingComplete: true,
    },
  });

  console.log(`📋 Se encontraron ${doctors.length} médico(s) en la base de datos.`);

  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  const results = [];

  for (const doc of doctors) {
    console.log(`\n🔍 Procesando Dr(a). ${doc.nombre} ${doc.apellido} (C.I. ${doc.nacionalidad}-${doc.cedula})...`);

    try {
      const sacsData = await scrapeSacsMpps(doc.cedula, (doc.nacionalidad as "V" | "E") || "V");

      if (sacsData.encontrado) {
        const hasRif = Boolean(doc.rif && doc.rif.trim().length >= 8);
        const hasMpps = Boolean(sacsData.matriculaMpps || doc.mppsMatricula);
        const hasSpec = Boolean(doc.especialidadPrincipal);

        const isOnboardingComplete = hasRif && hasMpps && hasSpec;

        const updateData: Record<string, any> = {
          isSacsVerified: true,
          isOnboardingComplete,
        };

        if (sacsData.matriculaMpps) {
          updateData.mppsMatricula = sacsData.matriculaMpps;
        }

        if (sacsData.nombre && !doc.nombre) {
          updateData.nombre = sacsData.nombre;
        }
        if (sacsData.segundoNombre && !doc.segundoNombre) {
          updateData.segundoNombre = sacsData.segundoNombre;
        }
        if (sacsData.apellido && !doc.apellido) {
          updateData.apellido = sacsData.apellido;
        }
        if (sacsData.segundoApellido && !doc.segundoApellido) {
          updateData.segundoApellido = sacsData.segundoApellido;
        }

        await db.doctor.update({
          where: { id: doc.id },
          data: updateData,
        });

        updatedCount++;
        console.log(`  ✅ Actualizado con éxito: Matrícula ${sacsData.matriculaMpps || "Preexistente"}, SACS Verificado: Sí, Onboarding Completo: ${isOnboardingComplete ? "Sí" : "No (Falta RIF)"}`);
        results.push({
          id: doc.id,
          nombre: `${doc.nombre} ${doc.apellido}`,
          cedula: `${doc.nacionalidad}-${doc.cedula}`,
          matriculaMpps: sacsData.matriculaMpps || doc.mppsMatricula,
          verificado: true,
          onboardingCompleto: isOnboardingComplete,
        });
      } else {
        notFoundCount++;
        console.log(`  ⚠️ No se encontró registro en SACS MPPS para la C.I. ${doc.nacionalidad}-${doc.cedula}.`);
        results.push({
          id: doc.id,
          nombre: `${doc.nombre} ${doc.apellido}`,
          cedula: `${doc.nacionalidad}-${doc.cedula}`,
          verificado: false,
          onboardingCompleto: false,
          nota: "Cédula no figura en SACS",
        });
      }
    } catch (err: any) {
      skippedCount++;
      console.error(`  ❌ Error al consultar SACS para ${doc.cedula}:`, err?.message || err);
    }

    // Pequeño delay de 500ms entre solicitudes para no saturar el servidor del SACS
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n==========================================");
  console.log(`📊 RESUMEN BACKFILL SACS:`);
  console.log(`  - Total Médicos: ${doctors.length}`);
  console.log(`  - Actualizados en SACS: ${updatedCount}`);
  console.log(`  - No Encontrados en SACS: ${notFoundCount}`);
  console.log(`  - Errores / Omitidos: ${skippedCount}`);
  console.log("==========================================\n");

  return {
    total: doctors.length,
    updatedCount,
    notFoundCount,
    skippedCount,
    results,
  };
}

if (require.main === module) {
  runSacsBackfill()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Backfill Script Failed:", err);
      process.exit(1);
    });
}

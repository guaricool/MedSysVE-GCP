import { PrismaClient } from '@prisma/client';
import { medicationsVE } from './data/medications-ve';


const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${medicationsVE.length} medications...`);
  for (const m of medicationsVE) {
    const seedId = `seed_${m.nombreGenerico.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    await prisma.medication.upsert({
      where: { id: seedId },
      update: {},
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
    });
  }
  const all = await prisma.medication.findMany({ where: { activo: true } });
  console.log(`Done. Seeded ${all.length} medications into PostgreSQL.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

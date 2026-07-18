import { db } from '../lib/db';

async function main() {
  const admins = await db.doctor.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, nombre: true, apellido: true }
  });
  console.log('Admins found:', admins);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());

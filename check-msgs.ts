import { db } from "./lib/db";
async function run() {
  const msgs = await db.mensaje.findMany({
    orderBy: { creadoAt: "desc" },
    take: 5
  });
  console.log(msgs);
}
run();

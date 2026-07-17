import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

async function main() {
  const dr = await db.doctor.findUnique({where: {email: "joguelpinto0810@gmail.com"}})
  if(!dr) return console.log("No dr")
  const ws = await db.workspace.findFirst({where: {doctorId: dr.id}})
  if(!ws) return console.log("No ws")

  const pats = await db.patientRegistration.findMany({
    where: {workspaceId: ws.id},
    select: {idDisplay: true, createdAt: true},
    orderBy: {idDisplay: "desc"},
    take: 15
  })
  console.log("DESC idDisplay:", pats)

  const patsDate = await db.patientRegistration.findMany({
    where: {workspaceId: ws.id},
    select: {idDisplay: true, createdAt: true},
    orderBy: {createdAt: "desc"},
    take: 15
  })
  console.log("DESC createdAt:", patsDate)
}

main().finally(() => db.$disconnect())

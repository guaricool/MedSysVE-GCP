import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:86930cc4ac0272b2120e8087532b7206@34.23.154.130:5432/medsysve"
  const pool = new Pool({
    connectionString: dbUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

let migrationCheckDone = false
export async function ensureDbSchema() {
  if (migrationCheckDone) return
  migrationCheckDone = true
  try {
    await db.$executeRawUnsafe(
      `ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "extraWorkspacesCount" INTEGER NOT NULL DEFAULT 0;`
    )
  } catch (err) {
    console.warn("[ensureDbSchema] Auto-migration execution note:", err)
  }
}

ensureDbSchema().catch(() => {})

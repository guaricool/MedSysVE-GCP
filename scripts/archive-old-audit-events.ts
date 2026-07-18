/**
 * Archive old AuditEvent rows by setting archivedAt = now().
 *
 * Retention policy: see docs/DATA_RETENTION.md. Default 5 years (LOPDP
 * Venezuela, Art. 19). Archived rows are kept indefinitely for compliance
 * but excluded from default queries (add `where: { archivedAt: null }`
 * in app code).
 *
 * Run with:
 *   npx tsx scripts/archive-old-audit-events.ts                  # default 5y
 *   npx tsx scripts/archive-old-audit-events.ts --retention-years=7
 *   npx tsx scripts/archive-old-audit-events.ts --dry-run
 *
 * Idempotent: rows already archived (archivedAt IS NOT NULL) are skipped.
 *
 * Requirements:
 *   - DATABASE_URL must be set
 *   - Run from a host with network access to the Postgres container
 *
 * Recommended schedule: monthly cron (see docs/DATA_RETENTION.md).
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

interface Args {
  retentionYears: number
  dryRun: boolean
}

function parseArgs(): Args {
  const args: Args = { retentionYears: 5, dryRun: false }
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--retention-years=")) {
      const v = Number(arg.split("=")[1])
      if (!Number.isFinite(v) || v <= 0) {
        console.error(`Invalid --retention-years value: ${arg}`)
        process.exit(1)
      }
      args.retentionYears = v
    } else if (arg === "--dry-run") {
      args.dryRun = true
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: npx tsx scripts/archive-old-audit-events.ts [options]\n" +
          "\nOptions:\n" +
          "  --retention-years=N   Archive events older than N years (default 5)\n" +
          "  --dry-run             Report what would be archived without writing\n" +
          "  --help, -h            Show this help",
      )
      process.exit(0)
    } else {
      console.error(`Unknown argument: ${arg}`)
      process.exit(1)
    }
  }
  return args
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL must be set")
    process.exit(1)
  }

  const args = parseArgs()
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - args.retentionYears)

  console.log("AuditEvent archival script")
  console.log("===========================")
  console.log(`Retention: ${args.retentionYears} years`)
  console.log(`Cutoff:    ${cutoff.toISOString()} (events older than this are eligible)`)
  console.log(`Mode:      ${args.dryRun ? "DRY RUN (no writes)" : "LIVE (will write)"}`)
  console.log("")

  // Count candidates — unarchived rows older than cutoff.
  const eligible = await prisma.auditEvent.count({
    where: {
      archivedAt: null,
      createdAt: { lt: cutoff },
    },
  })

  // Already archived (for reporting).
  const alreadyArchived = await prisma.auditEvent.count({
    where: { archivedAt: { not: null } },
  })

  // Total events (context).
  const total = await prisma.auditEvent.count()

  console.log(`Total AuditEvent rows:        ${total}`)
  console.log(`Already archived:            ${alreadyArchived}`)
  console.log(`Eligible to archive (live):  ${eligible}`)
  console.log("")

  if (eligible === 0) {
    console.log("Nothing to archive. Done.")
    return
  }

  if (args.dryRun) {
    console.log(`[DRY RUN] Would archive ${eligible} rows (no changes made).`)
    console.log("Run without --dry-run to apply.")
    return
  }

  // Apply in batched updates so very large result sets don't blow up memory.
  const BATCH_SIZE = 500
  let archived = 0
  let failed = 0
  const now = new Date()

  // Iterate via cursor (findMany with skip) — safer than OFFSET for large
  // tables because new rows being inserted won't shift the cursor.
  let lastSeenId: string | undefined = undefined
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch: Array<{ id: string }> = await prisma.auditEvent.findMany({
      where: {
        archivedAt: null,
        createdAt: { lt: cutoff },
        ...(lastSeenId ? { id: { gt: lastSeenId } } : {}),
      },
      orderBy: { id: "asc" },
      select: { id: true },
      take: BATCH_SIZE,
    })

    if (batch.length === 0) break

    const ids = batch.map((r) => r.id)
    lastSeenId = ids[ids.length - 1]

    try {
      // updateMany with `in` filter — single round-trip per batch.
      const result = await prisma.auditEvent.updateMany({
        where: { id: { in: ids } },
        data: { archivedAt: now },
      })
      archived += result.count
    } catch (err) {
      failed += ids.length
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  [batch ${ids[0]}..${ids[ids.length - 1]}] failed: ${msg}`)
    }

    process.stdout.write(
      `\rProgress: archived=${archived} failed=${failed} of eligible=${eligible}`,
    )
  }
  console.log("")

  console.log("=".repeat(60))
  console.log(`Archived: ${archived}`)
  console.log(`Failed:   ${failed}`)
  console.log(`Cutoff:   ${cutoff.toISOString()}`)
  console.log("=".repeat(60))

  if (failed > 0) {
    console.error(`\n${failed} row(s) failed — see errors above.`)
    process.exit(1)
  }

  console.log("\nDone. Verify with:")
  console.log(
    `  SELECT COUNT(*) FROM "AuditEvent" WHERE "archivedAt" IS NOT NULL;`,
  )
  console.log(
    `  SELECT MIN("archivedAt"), MAX("archivedAt") FROM "AuditEvent" WHERE "archivedAt" IS NOT NULL;`,
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

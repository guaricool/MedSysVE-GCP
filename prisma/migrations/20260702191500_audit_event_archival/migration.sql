-- Add archival support to AuditEvent.
-- Sets archivedAt on rows older than the retention window (default 5 years,
-- per docs/DATA_RETENTION.md and LOPDP Art. 19). Archived rows are kept
-- indefinitely for compliance but excluded from default queries.
--
-- Run with: npx prisma migrate deploy

ALTER TABLE "AuditEvent" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Partial-style index: speeds up "archived events ordered by date" queries
-- (e.g. for compliance reviews) without bloating the workspace/createdAt
-- hot-path index.
CREATE INDEX "AuditEvent_archivedAt_createdAt_idx" ON "AuditEvent"("archivedAt", "createdAt");
-- Audit S9 (2026-07-07): optimistic locking.
--
-- Adds `version` to Encounter. Incremented on every successful update via
-- the tRPC router (server/routers/encounter.ts). Conflicts are logged as
-- `ENCOUNTER_CONFLICT` audit events and surfaced as TRPCError CONFLICT
-- to the client.
--
-- Existing rows start at 0 (default). No backfill needed.
ALTER TABLE "Encounter" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

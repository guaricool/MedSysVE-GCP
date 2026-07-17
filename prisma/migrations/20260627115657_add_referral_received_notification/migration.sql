-- Add REFERRAL_RECEIVED to the NotificationType enum so the bell can show
-- "Tienes un referido pendiente" in-app when another doctor sends a referral.
--
-- ALTER TYPE ... ADD VALUE in Postgres 12+ is non-transactional — Prisma's
-- migrator runs this migration outside a transaction block automatically
-- (the engine writes a nontransactional flag into _prisma_migrations).
ALTER TYPE "NotificationType" ADD VALUE 'REFERRAL_RECEIVED';

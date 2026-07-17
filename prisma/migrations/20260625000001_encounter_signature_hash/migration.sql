-- Add signatureHash column for non-repudiable encounter signing.
-- Existing signed encounters will have NULL signatureHash until they are
-- re-signed or backfilled by a script. The field is optional so the app
-- keeps working with legacy data.
ALTER TABLE "Encounter" ADD COLUMN IF NOT EXISTS "signatureHash" TEXT;
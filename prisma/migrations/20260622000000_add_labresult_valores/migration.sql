-- Add structured `valores` field to LabResult for charting & trend analysis.
-- Optional JSON array of {parametro, valor, unidad, rangoReferencia, interpretado}.
ALTER TABLE "LabResult"
  ADD COLUMN IF NOT EXISTS "valores" JSONB,
  ADD COLUMN IF NOT EXISTS "notas" TEXT;
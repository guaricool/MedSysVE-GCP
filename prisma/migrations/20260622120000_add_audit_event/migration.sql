-- Comprehensive PHI-access audit trail.
-- Distinct from AuditLog (high-severity events); AuditEvent captures every
-- read/write of clinical data per HIPAA §164.312(b).

CREATE TABLE "AuditEvent" (
  "id"          TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "actorId"     TEXT,
  "actorRole"   TEXT,
  "action"      TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId"  TEXT,
  "patientId"   TEXT,
  "outcome"     TEXT NOT NULL DEFAULT 'ALLOWED',
  "denialReason" TEXT,
  "ip"          TEXT,
  "userAgent"   TEXT,
  "channel"     TEXT NOT NULL DEFAULT 'UI',
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditEvent_workspaceId_createdAt_idx" ON "AuditEvent"("workspaceId", "createdAt" DESC);
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt" DESC);
CREATE INDEX "AuditEvent_patientId_createdAt_idx" ON "AuditEvent"("patientId", "createdAt" DESC);
CREATE INDEX "AuditEvent_action_createdAt_idx" ON "AuditEvent"("action", "createdAt" DESC);
CREATE INDEX "AuditEvent_resourceType_resourceId_idx" ON "AuditEvent"("resourceType", "resourceId");

ALTER TABLE "AuditEvent"
  ADD CONSTRAINT "AuditEvent_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
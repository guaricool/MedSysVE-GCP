import { db } from "./db";
import { Prisma } from "@prisma/client";
import { safeLog } from "./log-sanitizer";
import { headers as nextHeaders } from "next/headers";

/**
 * Audit logging for PHI (Protected Health Information) access.
 *
 * Two-tier audit:
 *  - AuditLog (legacy): high-severity events (consultation signed, login
 *    failed, 2FA enabled, etc.). Used by existing callers via logAudit().
 *  - AuditEvent (new): every PHI access — view, edit, export, sign, print,
 *    download. Captured via audit() with a typed AuditAction.
 *
 * Compliance:
 *  - HIPAA §164.312(b): audit controls for PHI.
 *  - LOPDP (Venezuela, 2022) Art. 19 + 38: traceability of who accessed data.
 *  - When a patient asks "¿quién vio mi historia clínica?", we can answer.
 *
 * What we DO log (AuditEvent):
 *  - Every read of a clinical resource (Encounter, Prescription, LabResult, …)
 *  - Every write to a clinical resource
 *  - Every export (PDF, CSV)
 *  - Every login/logout
 *  - Every password change
 *  - Every 2FA change
 *  - Every denied access (for breach detection)
 *
 * What we DO NOT log:
 *  - The clinical content itself (only "VIEW" + resourceId)
 *  - Patient identifiers beyond IDs (use cuid, not cédula)
 *  - PHI in metadata (use IDs only)
 */

export type AuditAction =
  // Auth events
  | "LOGIN_OK"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_UNLOCKED"
  | "PASSWORD_CHANGED"
  | "TWO_FACTOR_ENABLED"
  | "TWO_FACTOR_DISABLED"
  | "TWO_FACTOR_FAILED"
  // PHI reads
  | "VIEW_PATIENT"
  | "VIEW_HISTORY"
  | "VIEW_ENCOUNTER"
  | "VIEW_PRESCRIPTION"
  | "VIEW_LAB_RESULT"
  | "VIEW_IMAGING"
  // PHI writes
  | "CREATE_ENCOUNTER"
  | "UPDATE_ENCOUNTER"
  | "SIGN_ENCOUNTER"
  | "AMEND_ENCOUNTER"
  | "CREATE_PRESCRIPTION"
  | "ADD_PRESCRIPTION_ITEM"
  | "REMOVE_PRESCRIPTION_ITEM"
  | "CREATE_DIAGNOSIS"
  | "REMOVE_DIAGNOSIS"
  | "PATIENT_UPDATED"
  | "PATIENT_DELETED"
  | "ENCOUNTER_DELETED"
  | "ENCOUNTER_REOPENED"
  | "CREATE_LAB_ORDER"
  | "CREATE_IMAGING_ORDER"
  | "SAVE_LAB_RESULT"
  | "DELETE_LAB_RESULT"
  | "CREATE_DOCUMENT"
  | "SIGN_DOCUMENT"
  // Exports
  | "EXPORT_PDF_HISTORY"
  | "EXPORT_PDF_PRESCRIPTION"
  | "EXPORT_PDF_LAB_ORDER"
  | "EXPORT_PDF_IMAGING_ORDER"
  | "EXPORT_PDF_INVOICE"
  | "EXPORT_PDF_VACCINE_CARNET"
  | "EXPORT_PDF_ENCOUNTER"
  | "EXPORT_PDF_DOCUMENT"
  | "EXPORT_CSV_PATIENTS"
  | "EXPORT_CSV_APPOINTMENTS"
  | "EXPORT_CSV_INVOICES"
  // AI / third-party disclosures
  | "AI_PHI_DISCLOSURE"
  // Clinical safety overrides
  | "ALLERGY_OVERRIDE"
  // Financial
  | "CREATE_INVOICE"
  | "MARK_INVOICE_PAID"
  | "CANCEL_INVOICE"
  | "ADD_PAGO"
  // Compliance
  | "DATA_EXPORT_GDPR"
  | "DATA_DELETE_GDPR"
  // Cross-workspace patient lookups (tenant-isolation sensitive operations).
  // Logged so admins can audit any probe attempts across doctor boundaries.
  | "PATIENT_CEDULA_CROSS_WORKSPACE_LOOKUP"
  | "PATIENT_AUTOFILL_FROM_OTHER_WORKSPACE"
  // Cross-workspace merge outcomes when accepting a referral that targets
  // an existing patient by cédula. Logged with the diff of fields that
  // changed (or stayed) so admins can verify data provenance.
  | "PATIENT_MERGE_KEEP"
  | "PATIENT_MERGE_UPDATE"
  // Access control
  | "ACCESS_DENIED"
  // Concurrent-edit detection (audit S9, 2026-07-07). Logged whenever an
  // optimistic-locking update on Encounter detects a version mismatch.
  // Operationally important for spotting both legitimate multi-doctor
  // collaboration and potential data-loss scenarios.
  | "ENCOUNTER_CONFLICT"
  // Scraping / rate-limit anomalies
  | "PAGINATION_ANOMALY"


export interface AuditContext {
  userId?: string | null
  userRole?: string | null
  workspaceId?: string | null
  ip?: string | null
  userAgent?: string | null
  resourceType?: string
  resourceId?: string
  patientId?: string | null
  reason?: string
  outcome?: "ALLOWED" | "DENIED"
  channel?: "UI" | "API" | "PDF" | "EXPORT" | "PORTAL" | "CRON" | "SUPPORT_BOT"
  metadata?: Record<string, unknown>
}

/**
 * Main audit function. ALWAYS logs to AuditEvent (comprehensive).
 * For severe events, ALSO logs to AuditLog (legacy, kept for backwards compat
 * with existing dashboard queries).
 */
export async function audit(
  action: AuditAction,
  ctx: AuditContext = {},
): Promise<void> {
  // Truncate IP for privacy (keep /24 for IPv4, /48 for IPv6).
  const safeIp = ctx.ip ? truncateIp(ctx.ip) : null;

  // 1. Always write to AuditEvent (the new comprehensive table).
  // Require a workspaceId on every call. Events without a workspace context
  // would either cross tenant boundaries (if we used "system") or hide in
  // a junk bucket. Callers with no workspace (e.g. pre-auth LOGIN_FAILED)
  // should pass an empty string explicitly.
  if (!ctx.workspaceId) {
    safeLog("error", "audit.missing_workspace", {
      action,
      userId: ctx.userId ?? null,
    });
    return;
  }
  try {
    await db.auditEvent.create({
      data: {
        workspaceId: ctx.workspaceId,
        actorId: ctx.userId ?? null,
        actorRole: ctx.userRole ?? null,
        action,
        resourceType: ctx.resourceType ?? "system",
        resourceId: ctx.resourceId ?? null,
        patientId: ctx.patientId ?? null,
        outcome: ctx.outcome ?? "ALLOWED",
        denialReason: ctx.outcome === "DENIED" ? ctx.reason ?? null : null,
        ip: safeIp,
        userAgent: ctx.userAgent?.slice(0, 500) ?? null,
        channel: ctx.channel ?? "UI",
        metadata: ctx.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    safeLog("error", "audit.event_persist_failed", {
      action,
      error: err instanceof Error ? err.message : "unknown",
    });
  }

  // 2. Also write to AuditLog for legacy dashboard queries (high-severity only).
  const LEGACY_SEVERE: AuditAction[] = [
    "LOGIN_OK", "LOGIN_FAILED", "ACCOUNT_LOCKED", "PASSWORD_CHANGED",
    "SIGN_ENCOUNTER", "AMEND_ENCOUNTER",
    "EXPORT_PDF_HISTORY", "EXPORT_PDF_PRESCRIPTION", "EXPORT_PDF_VACCINE_CARNET",
    "EXPORT_CSV_PATIENTS", "EXPORT_CSV_APPOINTMENTS", "EXPORT_CSV_INVOICES",
    "AI_PHI_DISCLOSURE",
    "MARK_INVOICE_PAID",
    "TWO_FACTOR_ENABLED", "TWO_FACTOR_DISABLED",
    "DATA_EXPORT_GDPR", "DATA_DELETE_GDPR",
    "ACCESS_DENIED",
    "PAGINATION_ANOMALY",
  ];
  if (LEGACY_SEVERE.includes(action)) {
    try {
      await db.auditLog.create({
        data: {
          accion: action,
          workspaceId: ctx.workspaceId,
          entidad: ctx.resourceType ?? "system",
          entidadId: ctx.resourceId,
          actorId: ctx.userId,
          detalle: {
            patientId: ctx.patientId,
            outcome: ctx.outcome,
            channel: ctx.channel,
            metadata: ctx.metadata,
          } as Prisma.InputJsonValue,
          ip: safeIp,
        },
      });
    } catch (err) {
      safeLog("error", "audit.legacy_persist_failed", {
        action,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  // 3. Also log to stdout (Loki/Vector).
  safeLog("info", `audit.${action}`, {
    userId: ctx.userId ? ctx.userId.slice(0, 8) + "***" : null,
    userRole: ctx.userRole,
    workspaceId: ctx.workspaceId ? ctx.workspaceId.slice(0, 8) + "***" : null,
    resourceType: ctx.resourceType,
    resourceId: ctx.resourceId ? ctx.resourceId.slice(0, 8) + "***" : null,
    patientId: ctx.patientId ? ctx.patientId.slice(0, 8) + "***" : null,
    outcome: ctx.outcome,
    channel: ctx.channel,
  });
}

function truncateIp(ip: string): string {
  // IPv4: a.b.c.d → a.b.c.0 (keep /24)
  // IPv6: keep /48
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 3).join(":") + ":0:0:0:0:0";
  }
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  return ip;
}

/**
 * Convenience wrapper — captures request context (IP, UA) from headers.
 */
export async function auditFromHeaders(
  action: AuditAction,
  ctx: AuditContext,
  headersList: Headers,
): Promise<void> {
  await audit(action, {
    ...ctx,
    ip: headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        null,
    userAgent: headersList.get("user-agent") || null,
  });
}

/**
 * Legacy logAudit() — direct-write to AuditLog model.
 *
 * Used by existing callers (e.g. encounter.ts) that write clinical events.
 * New code should prefer `audit()` with a typed AuditAction.
 *
 * IMPORTANT: caller is responsible for passing already-redacted context.
 */
export interface LegacyAuditInput {
  workspaceId: string
  accion: string
  entidad: string
  entidadId?: string
  actorId?: string
  actorNombre?: string
  detalle?: unknown
  ip?: string
}
export async function logAudit(input: LegacyAuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        accion: input.accion,
        entidad: input.entidad,
        entidadId: input.entidadId,
        actorId: input.actorId,
        actorNombre: input.actorNombre,
        detalle: input.detalle as Prisma.InputJsonValue | undefined,
        ip: input.ip,
      },
    });
  } catch (err) {
    safeLog("error", "audit.legacy_persist_failed", {
      accion: input.accion,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

// ===========================================================================
// Active (non-archived) AuditEvent reads
//
// Retention policy: AuditEvent rows older than 5 years (default) are marked
// archivedAt by scripts/archive-old-audit-events.ts (cron monthly). Archived
// rows are KEPT in the table indefinitely for compliance reporting but should
// NOT appear in default app queries (dashboard, exports, recent activity).
//
// Use these helpers from app code; they default to non-archived. For
// compliance/LOPDP reporting queries that intentionally want archived rows,
// pass includeArchived: true (and document why).
// ===========================================================================

export interface ListActiveAuditEventsOptions {
  /** Filter by actor (doctor/staff userId). */
  actorId?: string;
  /** Filter by action (e.g. "VIEW_PATIENT"). */
  action?: AuditAction | string;
  /** Filter by resource type (e.g. "Encounter", "PatientRegistration"). */
  resourceType?: string;
  /** Filter by patientRegistrationId (when resource is patient-scoped). */
  patientId?: string;
  /** Inclusive lower bound on createdAt. */
  from?: Date;
  /** Inclusive upper bound on createdAt. */
  to?: Date;
  /** Max rows to return. Default 100. */
  take?: number;
  /** Offset for pagination. Default 0. */
  skip?: number;
  /** Include archived rows (compliance reporting only). Default false. */
  includeArchived?: boolean;
}

/**
 * List AuditEvent rows for a workspace, defaulting to non-archived.
 *
 * Compliance: filtered reads keep dashboard / recent-activity views fast
 * and avoid surfacing >5y events in normal user interactions. Archived
 * rows remain accessible via includeArchived: true for LOPDP / MPPS
 * reporting queries.
 */
export async function listActiveAuditEvents(
  workspaceId: string,
  opts: ListActiveAuditEventsOptions = {},
) {
  const where: Record<string, unknown> = { workspaceId };
  if (!opts.includeArchived) where.archivedAt = null;
  if (opts.actorId) where.actorId = opts.actorId;
  if (opts.action) where.action = opts.action;
  if (opts.resourceType) where.resourceType = opts.resourceType;
  if (opts.patientId) where.patientId = opts.patientId;
  if (opts.from || opts.to) {
    where.createdAt = {
      ...(opts.from ? { gte: opts.from } : {}),
      ...(opts.to ? { lte: opts.to } : {}),
    };
  }
  return db.auditEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 100,
    skip: opts.skip ?? 0,
  });
}

/**
 * Get a single AuditEvent by id, defaulting to non-archived.
 * Pass includeArchived: true for compliance queries.
 */
export async function getActiveAuditEvent(
  id: string,
  opts: { includeArchived?: boolean } = {},
) {
  return db.auditEvent.findFirst({
    where: {
      id,
      ...(opts.includeArchived ? {} : { archivedAt: null }),
    },
  });
}

/**
 * Count AuditEvent rows for a workspace, defaulting to non-archived.
 */
export async function countActiveAuditEvents(
  workspaceId: string,
  opts: Omit<ListActiveAuditEventsOptions, "take" | "skip"> = {},
) {
  const where: Record<string, unknown> = { workspaceId };
  if (!opts.includeArchived) where.archivedAt = null;
  if (opts.actorId) where.actorId = opts.actorId;
  if (opts.action) where.action = opts.action;
  if (opts.resourceType) where.resourceType = opts.resourceType;
  if (opts.patientId) where.patientId = opts.patientId;
  if (opts.from || opts.to) {
    where.createdAt = {
      ...(opts.from ? { gte: opts.from } : {}),
      ...(opts.to ? { lte: opts.to } : {}),
    };
  }
  return db.auditEvent.count({ where });
}
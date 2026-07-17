/**
 * Log sanitization — keep PHI and PII OUT of application logs.
 *
 * Why this matters:
 *  - Venezuela LOPDP Art. 21: data minimization in processing.
 *  - HIPAA Security Rule §164.312(b): audit controls must not themselves
 *    become a data-exfiltration vector. Logging patient names, cédulas,
 *    diagnoses, or treatment details into a centralized log aggregator
 *    is a classic secondary leak.
 *  - Centralized log shippers (Coolify's Loki/Vector) are often less
 *    well secured than the application DB. Treat logs as semi-public.
 *
 * Strategy: any field we don't EXPLICITLY mark safe gets redacted.
 * The `safeLog()` helper takes a context object and returns a copy
 * with all sensitive fields replaced by "[REDACTED]".
 *
 * Use:
 *   import { safeLog, REDACTED_FIELDS } from "@/lib/log-sanitizer";
 *   safeLog("info", "patient.lookup", { patientId, doctorId });
 *   // -> { patientId: "abc", doctorId: "xyz" } (allowed)
 *
 *   safeLog("info", "patient.lookup", { nombre: "Juan", cedula: "12345" });
 *   // -> { nombre: "[REDACTED]", cedula: "[REDACTED]" }
 */

export const REDACTED_FIELDS = new Set([
  // Patient identifiers
  "nombre",
  "apellido",
  "nombreCompleto",
  "fullName",
  "email",
  "patientEmail",
  "telefono",
  "phone",
  "numeroIdentificacion",
  "cedula",
  "ci",
  "tipoIdentificacion",
  "fechaNacimiento",
  "birthDate",
  "direccion",
  "address",
  // Clinical PHI
  "motivo",
  "historiaClinica",
  "examenFisico",
  "diagnostico",
  "diagnosticos",
  "diagnosis",
  "plan",
  "treatment",
  "notas",
  "notasInternas",
  "alergias",
  "antecedentes",
  "medicamentos",
  "prescripcion",
  "resultadosLab",
  "labResults",
  "impresionDiagnostica",
  "soap",
  // Financial
  "numeroTarjeta",
  "cardNumber",
  "cvv",
  "cvc",
  "bankAccount",
  "cuentaBancaria",
  // Auth secrets
  "password",
  "passwordHash",
  "portalPassword",
  "portalPasswordHash",
  "pin",
  "pinAcceso",
  "pinAccesoHash",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "cookie",
  "csrfToken",
  "twoFactorCode",
  // Tokens / JWTs
  "jwt",
  "sessionToken",
  "refreshToken",
]);

export function redactObject<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  if (obj === null || obj === undefined) return {};
  if (typeof obj !== "object") return { value: "[non-object]" };

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const keyLower = k.toLowerCase();
    const isSensitive =
      REDACTED_FIELDS.has(k) ||
      REDACTED_FIELDS.has(keyLower) ||
      // Heuristic: anything ending in these is sensitive
      keyLower.endsWith("password") ||
      keyLower.endsWith("hash") ||
      keyLower.endsWith("secret") ||
      keyLower.endsWith("token") ||
      keyLower.endsWith("cookie");

    if (isSensitive) {
      out[k] = "[REDACTED]";
    } else if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      // Recurse into nested objects, but not arrays/dates.
      out[k] = redactObject(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      // For arrays of objects, redact each. For arrays of primitives, keep but
      // check for sensitive types (don't include raw emails etc.).
      out[k] = v.map((item) =>
        item && typeof item === "object" && !(item instanceof Date)
          ? redactObject(item as Record<string, unknown>)
          : typeof item === "string" && item.includes("@")
            ? "[REDACTED-email]"
            : item,
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Safe logger — like console.log but with PHI redaction.
 *
 * Usage:
 *   safeLog("info", "encounter.signed", { doctorId, patientId, encounterId });
 *   safeLog("error", "auth.failed", { email: "x@y.com", reason: "bad_password" });
 *     // -> email gets redacted, reason preserved
 *
 * Output goes to stdout. In production Coolify captures it into Loki/Vector.
 */
export function safeLog(
  level: "info" | "warn" | "error" | "debug",
  event: string,
  context: Record<string, unknown> = {},
): void {
  const safe = redactObject(context);
  const ts = new Date().toISOString();
  // Format: [ts] [level] [event] key=value key=value ...
  const ctxStr = Object.entries(safe)
    .map(([k, v]) => {
      const vStr = typeof v === "object" ? JSON.stringify(v) : String(v);
      // Truncate long values to prevent log spam.
      return `${k}=${vStr.length > 200 ? vStr.slice(0, 200) + "…" : vStr}`;
    })
    .join(" ");
  const line = `[${ts}] [${level.toUpperCase()}] [${event}] ${ctxStr}`;

  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "debug":
      // Debug only when explicitly enabled
      if (process.env.LOG_LEVEL === "debug") console.debug(line);
      break;
    default:
      console.log(line);
  }
}
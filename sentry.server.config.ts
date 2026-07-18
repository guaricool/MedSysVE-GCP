/**
 * Sentry server-side init for MedSysVE.
 *
 * Captures unhandled exceptions in:
 *  - tRPC routers (server/routers/*.ts)
 *  - Route handlers (app/api/**)
 *  - Server Components
 *  - Cron scripts in /scripts/
 *
 * Compliance (cite per design choice):
 *  - LOPDP (Venezuela, 2022): Art. 19 — medidas técnicas y organizativas
 *    apropiadas. PHI scrubbing via beforeSend: any field that looks like a
 *    patient identifier, cédula, RIF, email, phone, or token is REDACTED.
 *  - GDPR Art. 32 (best practice): no raw PHI to error tracking.
 *  - OWASP A09:2021 — Security Logging and Monitoring Failures. This file
 *    is the mitigation: errors are captured centrally + scrubbed before
 *    leaving the server.
 *
 * DSN points at GlitchTip self-hosted on the Contabo VPS
 * (glitchtip.13.140.181.29.sslip.io). GlitchTip is Sentry-API-compatible.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Capture rate: 100% of errors, 10% of transactions in prod (perf cost).
    // Adjust via env if traffic changes.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),

    // Send user PII? NEVER — GlitchTip stores errors only, and we treat
    // email/patient-id as PHI. Default behavior is no PII; we keep it that way.
    sendDefaultPii: false,

    // Environment: production / preview / development.
    // Sentry uses this to filter dashboards.
    environment: process.env.NODE_ENV ?? "development",

    // Release tracking: tied to git SHA so we can correlate errors with deploys.
    // Coolify sets GIT_COMMIT_SHA at deploy time; we fall back to a placeholder.
    release: process.env.GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? "medsysve@unknown",

    // Don't capture errors from these noisy sources (server-side only).
    ignoreErrors: [
      // Postgres connection blips during deploys/reboots — not actionable.
      "Connection terminated",
      "ECONNREFUSED",
      // Next.js dev-mode HMR noise.
      "ResizeObserver loop",
    ],

    beforeSend(event, hint) {
      // Scrub request body / extra context for PHI before sending.
      // Patterns cover: Venezuelan cédula (V-/E-/J- prefix), RIF (J/G),
      // email addresses, and our specific Prisma model field names that
      // we know carry PHI (patient, encounter, doctor, prescription, etc.).
      const phiFieldPattern =
        /^(patient|patientRegistration|cedula|rif|email|telefono|phone|password|token|secret|apiKey|prescription|diagnostico|diagnóstico|notas|note|history|allergy|medication|dni|passport|surname)$/i;
      const phiValuePattern =
        /\b([VEJGPvejgp]-\d{6,9})\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g;

      const scrub = (obj: unknown): unknown => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === "string") return obj.replace(phiValuePattern, "[REDACTED]");
        if (Array.isArray(obj)) return obj.map(scrub);
        if (typeof obj === "object") {
          const out: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
            if (phiFieldPattern.test(k)) {
              out[k] = "[REDACTED]";
            } else {
              out[k] = scrub(v);
            }
          }
          return out;
        }
        return obj;
      };

      // Scrub request data (body / query / extra).
      if (event.request) {
        if (event.request.data) event.request.data = scrub(event.request.data) as never;
        if (event.request.query_string) {
          event.request.query_string = String(event.request.query_string).replace(
            phiValuePattern,
            "[REDACTED]",
          );
        }
        // Strip cookies entirely (Auth.js session-token would otherwise leak).
        if (event.request.cookies) delete event.request.cookies;
        if (event.request.headers) {
          const headers = event.request.headers as Record<string, string>;
          for (const sensitive of ["authorization", "cookie", "x-auth", "x-api-key"]) {
            if (headers[sensitive]) headers[sensitive] = "[REDACTED]";
          }
        }
      }

      // Scrub user context if present.
      if (event.user) {
        if (event.user.email) event.user.email = "[REDACTED]";
        if (event.user.ip_address) {
          // LOPDP Art. 19: IPs are personal data. Keep only /24 subnet for geo.
          const parts = String(event.user.ip_address).split(".");
          if (parts.length === 4) event.user.ip_address = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
        }
      }

      // Scrub extra/context.
      if (event.extra) event.extra = scrub(event.extra) as typeof event.extra;
      if (event.contexts) event.contexts = scrub(event.contexts) as typeof event.contexts;
      if (event.tags) event.tags = scrub(event.tags) as typeof event.tags;

      // Scrub breadcrumbs.
      if (event.breadcrumbs) {
        for (const crumb of event.breadcrumbs) {
          if (crumb.data) crumb.data = scrub(crumb.data) as Record<string, unknown>;
        }
      }

      // Scrub exception values (sometimes contain query params with PHI).
      if (event.exception?.values) {
        for (const ex of event.exception.values) {
          if (ex.value) ex.value = String(ex.value).replace(phiValuePattern, "[REDACTED]");
        }
      }

      return event;
    },
  });
}

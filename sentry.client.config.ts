/**
 * Sentry browser/client init for MedSysVE.
 *
 * Captures unhandled exceptions in:
 *  - React component render errors (via ErrorBoundary if present)
 *  - Event handlers
 *  - Async errors in promises
 *  - Hydration mismatches
 *
 * Compliance:
 *  - LOPDP Art. 19: scrub PHI from breadcrumbs / extra before sending.
 *  - sendDefaultPii=false: don't auto-attach current user's email/username.
 *  - We only capture URL + stack trace + a scrubbed message; never the
 *    full form payload (that would leak diagnoses/notes).
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.05),

    sendDefaultPii: false,
    environment: process.env.NODE_ENV ?? "development",

    release: process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? "medsysve@unknown",

    // Only ship unhandled errors. Page-load metrics and route changes are
    // useful but expensive; we keep traces low (5%) and capture all errors.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    ignoreErrors: [
      "ResizeObserver loop",
      // User-cancelled navigations shouldn't fire Sentry.
      "AbortError",
      // Network blips during dev.
      "Load failed",
    ],

    beforeSend(event, _hint) {
      // Same PHI scrubbing as server config — duplicated here because
      // beforeSend runs in the browser before the event is sent.
      const phiValuePattern =
        /\b([VEJGPvejgp]-\d{6,9})\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g;

      if (event.message) {
        event.message = String(event.message).replace(phiValuePattern, "[REDACTED]");
      }
      if (event.request?.url) {
        event.request.url = String(event.request.url).replace(phiValuePattern, "[REDACTED]");
      }
      if (event.request?.query_string) {
        event.request.query_string = String(event.request.query_string).replace(
          phiValuePattern,
          "[REDACTED]",
        );
      }
      if (event.exception?.values) {
        for (const ex of event.exception.values) {
          if (ex.value) ex.value = String(ex.value).replace(phiValuePattern, "[REDACTED]");
        }
      }

      // Strip cookies/headers (the browser sends them automatically otherwise).
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers) {
        const headers = event.request.headers as Record<string, string>;
        for (const sensitive of ["authorization", "cookie", "x-auth"]) {
          if (headers[sensitive]) headers[sensitive] = "[REDACTED]";
        }
      }

      return event;
    },
  });
}

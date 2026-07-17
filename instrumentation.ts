/**
 * Next.js instrumentation entry point.
 *
 * Runs once per worker process on startup. We conditionally import the
 * Sentry init configs based on which runtime is booting:
 *  - `nodejs` (server): Sentry.init from sentry.server.config.ts
 *  - `edge`            : Sentry.init from sentry.edge.config.ts
 *
 * Next.js 15+ stable instrumentationHook (no experimental flag needed).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
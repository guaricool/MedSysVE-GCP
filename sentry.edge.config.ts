/**
 * Sentry edge runtime init for MedSysVE.
 *
 * Edge runtime runs in middleware.ts and any route handlers marked with
 * `export const runtime = 'edge'`. We initialize Sentry here too so errors
 * in middleware (e.g., auth redirects) are captured.
 *
 * Note: edge runtime has stricter limits (no Node APIs). We use the
 * minimal Sentry config and rely on the same DSN as the server config.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.05),
    sendDefaultPii: false,
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.GIT_COMMIT_SHA ?? "medsysve@unknown",
  });
}
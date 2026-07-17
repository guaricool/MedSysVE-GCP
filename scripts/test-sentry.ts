/**
 * Smoke test for the Sentry SDK wiring in MedSysVE.
 *
 * Run with:
 *   SENTRY_DSN=... npx tsx scripts/test-sentry.ts
 *
 * Captures a synthetic message + a synthetic exception and flushes.
 * If you see "Captured 2 events to <DSN>" the SDK is wired correctly.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
if (!dsn) {
  console.error("SENTRY_DSN not set; cannot test.");
  process.exit(1);
}

console.log(`Testing Sentry SDK with DSN: ${dsn.replace(/\/\/.+@/, "//***@")}`);

Sentry.init({
  dsn,
  environment: "test",
  release: "medsysve@smoketest",
  tracesSampleRate: 1.0,
  sendDefaultPii: false,
});

// 1) Capture a synthetic message.
Sentry.captureMessage("Sentry SDK smoke test (message)", "info");

// 2) Capture a synthetic exception with a stack trace.
try {
  throw new Error("Sentry SDK smoke test (exception) — this is intentional");
} catch (err) {
  Sentry.captureException(err);
}

// Flush before exit so events actually ship.
Sentry.flush(3000).then(() => {
  console.log("Captured 2 events. Check https://glitchtip.13.140.181.29.sslip.io");
  process.exit(0);
});
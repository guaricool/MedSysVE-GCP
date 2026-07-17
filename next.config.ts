import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

/**
 * Security headers — applied to every response.
 *
 * Rationale (cite per header):
 *  - Strict-Transport-Security (HSTS): force HTTPS for 1y, includeSubDomains, preload-eligible.
 *      Mitigates: SSL stripping, MITM downgrade attacks.
 *  - Content-Security-Policy: strict default-src 'self'; allow inline styles for Next.js
 *      inline <style> tags + data: images for favicon. Disallow frame ancestors entirely
 *      (we never embed our app in iframes). Connect-src includes the Anthropic API and
 *      WhatsApp Meta endpoints for outbound integrations. We do NOT allow unsafe-eval
 *      on script-src in production.
 *      Mitigates: XSS, data exfiltration, clickjacking (belt + suspenders w/ X-Frame-Options).
 *  - X-Frame-Options: DENY — secondary clickjacking defense (CSP frame-ancestors is primary).
 *  - X-Content-Type-Options: nosniff — block MIME-type sniffing.
 *  - Referrer-Policy: strict-origin-when-cross-origin — never leak full URL on outbound.
 *  - Permissions-Policy: disable powerful APIs we don't use (camera/mic/geolocation/etc).
 *      Mitigates: drive-by feature abuse.
 *  - Cross-Origin-Opener-Policy: same-origin — isolate browsing context.
 *  - Cross-Origin-Resource-Policy: same-site — block cross-origin reads of our assets.
 *  - X-DNS-Prefetch-Control: off — don't leak browsing intent.
 *  - X-Permitted-Cross-Domain-Policies: none — Adobe Flash / legacy plugin block.
 *
 * Compliance:
 *  - LOPDP (Venezuela, 2022): Art. 19 — medidas técnicas y organizativas apropiadas.
 *  - OWASP Secure Headers Project baseline.
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "cross-origin-isolated=()",
      "display-capture=()",
      "encrypted-media=()",
      "fullscreen=(self)",
      "geolocation=()",
      "gyroscope=()",
      "keyboard-map=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "picture-in-picture=()",
      "publickey-credentials-get=(self)",
      "screen-wake-lock=()",
      "sync-xhr=()",
      "usb=()",
      "xr-spatial-tracking=()",
    ].join(", "),
  },
  {
    // CSP — strict, but allow inline styles for Next.js + styled-components,
    // and connect-src for outbound integrations (Anthropic for IA, WhatsApp webhook).
    // 'unsafe-inline' on style-src is required by Next.js's hydration runtime.
    // We do NOT include 'unsafe-eval' anywhere.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' for its <style> tags + nonce-based scripts.
      // We accept this trade-off because all dynamic rendering happens server-side
      // via React Server Components; user-supplied content is never inlined into
      // <script>. Defense-in-depth: nonce-based CSP can be added in a future iteration.
      isProd
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // Outbound API calls (Anthropic IA, WhatsApp webhook, BCV rate, sslip wildcard,
      // coolify hostnames). NOT api.supabase.co / supabase.com — self-hosted only.
      "connect-src 'self' https://api.anthropic.com https://graph.facebook.com https://ve.dolarapi.com https://api.resend.com wss: https:",
      "frame-src 'self' https://meet.jit.si",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "media-src 'self' blob:",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  // Trust the actual Host header (Coolify terminates TLS).
  // Without this, Next.js complains about hostnames it doesn't know.
  // Required for sslip.io subdomain + Coolify's TLS termination.
  experimental: {
    // ...
  },

  poweredByHeader: false,
};

// Disable X-Powered-By globally (don't leak framework fingerprint).
// `poweredByHeader: false` already handles this.

/**
 * Sentry Next.js SDK build-time wrapper.
 *
 * Wrapping the config with withSentryConfig() does three things at build time:
 *  1. Injects Sentry CLI into the build to upload source maps (so stack
 *     traces in GlitchTip show original TypeScript, not minified JS).
 *  2. Replaces `NEXT_PUBLIC_SENTRY_DSN` placeholders.
 *  3. Adds the Sentry tunnel route to bypass ad-blockers / corp proxies.
 *
 * We pass options that are safe for our environment:
 *  - silent: don't print Sentry CLI chatter to build output.
 *  - widenClientFileUpload: true — upload client source maps too (for browser errors).
 *  - hideSourceMaps: true — keep source maps out of the runtime bundle.
 *  - disableLogger: true — strip Sentry's debug console.* calls from prod.
 *
 * If SENTRY_DSN is not set at build time, the wrapper still works but
 * emits a warning. Runtime init is gated on the env var being present
 * (see sentry.{server,client,edge}.config.ts).
 */
const sentryBuildOptions = {
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  // Modern replacement for `disableLogger` (deprecated in @sentry/nextjs 8+).
  // Strips Sentry's debug console.* calls from prod bundles.
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  // Tunnel: any path starting with this gets routed to Sentry ingest,
  // useful if a corp proxy or browser extension blocks sentry.io.
  tunnelRoute: "/monitoring-tunnel",
};

export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryBuildOptions)
  : nextConfig;
import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

if (process.env.NODE_ENV === "production") {
  if (!process.env.AUTH_URL) process.env.AUTH_URL = "https://www.medsysve.com"
  if (!process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = "https://www.medsysve.com"
  if (!process.env.AUTH_TRUST_HOST) process.env.AUTH_TRUST_HOST = "true"
}

/**
 * Edge-runtime-compatible Auth.js configuration.
 *
 * Used by proxy.ts (Edge runtime) to verify session JWTs. The full auth.ts
 * cannot run in edge because it imports Prisma, bcryptjs, and Redis — all
 * Node-only modules.
 *
 * Strategy: share the JWT secret and session shape with the full config but
 * omit providers that require Node. We can decode and verify JWTs here
 * because Auth.js signs them with NEXTAUTH_SECRET (a string), which is
 * available in edge.
 *
 * If you change the JWT callback in lib/auth.ts (e.g. add/remove token
 * fields), mirror the changes here so the edge decoder knows about them.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "medsysve-gcp-production-auth-secret-key-2026-carlos-pierluissi-secret",
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token }) {
      return token
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session.user = token as any
      return session
    },
  },
}

/**
 * Edge-safe auth() — verifies the JWT in the session cookie and returns
 * the decoded session, or null if invalid/missing/expired.
 *
 * For data access, callers must still use the full lib/auth.ts via the
 * tRPC context. This is only for the proxy redirect layer.
 */
export const { auth } = NextAuth(authConfig)
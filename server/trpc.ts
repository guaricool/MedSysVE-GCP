import { initTRPC, TRPCError } from "@trpc/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ZodError } from "zod"
import type { SessionUser } from "@/types"
import { Redis } from "@upstash/redis"
import { audit } from "@/lib/audit"
import { logInfo, reportError } from "@/lib/gcp-observability"

// Create Redis client if env vars exist
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null

export async function createContext() {
  const session = await auth()
  return {
    session: session?.user as SessionUser | null,
    db,
  }
}

type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router

export const gcpTelemetryMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  const start = performance.now()
  logInfo(`tRPC request started: ${path}`, { path, type })
  
  try {
    const result = await next()
    const duration = performance.now() - start
    
    if (!result.ok && result.error) {
      reportError(result.error, {
        path,
        type,
        userId: ctx.session?.id,
        workspaceId: ctx.session?.workspaceId,
      })
    } else {
      logInfo(`tRPC request completed: ${path}`, {
        path,
        type,
        durationMs: duration,
        userId: ctx.session?.id,
        workspaceId: ctx.session?.workspaceId,
      })
    }
    
    return result
  } catch (err: any) {
    const duration = performance.now() - start
    reportError(err, {
      path,
      type,
      durationMs: duration,
      userId: ctx.session?.id,
      workspaceId: ctx.session?.workspaceId,
    })
    throw err
  }
})

export const publicProcedure = t.procedure.use(gcpTelemetryMiddleware)

export const protectedProcedure = publicProcedure.use(async ({ ctx, path, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" })
  
  // Anti-Scraping / Pagination Anomaly Detection
  // We limit each authenticated user to 300 tRPC requests per 5 minutes.
  // This is generous enough for normal use but blocks aggressive scraping scripts.
  if (redis && ctx.session.id) {
    const key = `rl:user:trpc:${ctx.session.id}`
    const windowSec = 300
    const maxRequests = 300

    try {
      const pipelineRes = (await redis.pipeline().incr(key).expire(key, windowSec, "NX").exec()) as any[]
      const count = Number(pipelineRes?.[0] ?? 0)

      if (count > maxRequests) {
        // Log critical security anomaly
        await audit("PAGINATION_ANOMALY", {
          userId: ctx.session.id,
          userRole: ctx.session.role,
          workspaceId: ctx.session.workspaceId,
          channel: "API",
          metadata: { path, count, windowSec },
          outcome: "DENIED",
          reason: "User exceeded tRPC rate limit (Slow Scraping defense)",
        })
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Please slow down.",
        })
      }
    } catch (err) {
      if (err instanceof TRPCError) throw err
      // If Redis fails, we fail open to not break the app for legitimate users
      console.error("[tRPC Rate Limit Error]", err)
    }
  }

  return next({ ctx: { ...ctx, session: ctx.session } })
})

export const doctorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.role !== "DOCTOR") {
    throw new TRPCError({ code: "FORBIDDEN" })
  }
  return next({ ctx })
})

export const portalProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session || ctx.session.role !== "PATIENT") {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  const patientId = ctx.session.id
  return next({ ctx: { ...ctx, session: ctx.session, patientId } })
})

/**
 * Procedure restricted to authenticated clinic admins (OWNER or MANAGER).
 *
 * Adds `clinicId` to the context derived from the session, so downstream
 * resolvers don't need to read it from `ctx.session`. All admin-only
 * operations (manage staff, rotate invitation code, view billing) MUST
 * filter by `ctx.clinicId` to prevent cross-clinic data leaks — the
 * same isolation pattern used by `doctorProcedure` for workspaces.
 */
export const clinicAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.role !== "CLINIC_ADMIN" || !ctx.session.clinicId) {
    throw new TRPCError({ code: "FORBIDDEN" })
  }
  const clinicId = ctx.session.clinicId
  return next({ ctx: { ...ctx, clinicId } })
})

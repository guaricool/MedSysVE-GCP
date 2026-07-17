import { initTRPC, TRPCError } from "@trpc/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ZodError } from "zod"
import type { SessionUser } from "@/types"

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
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" })
  return next({ ctx: { ...ctx, session: ctx.session } })
})

export const doctorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.role !== "DOCTOR") {
    throw new TRPCError({ code: "FORBIDDEN" })
  }
  return next({ ctx })
})

export const portalProcedure = t.procedure.use(({ ctx, next }) => {
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

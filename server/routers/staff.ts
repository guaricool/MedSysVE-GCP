import { router, doctorProcedure } from "../trpc"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { TRPCError } from "@trpc/server"
import { StaffRole } from "@prisma/client"
import { pinSchema, BCRYPT_COST } from "@/lib/password-policy"
import { safeLog } from "@/lib/log-sanitizer"

export const staffRouter = router({
  list: doctorProcedure.query(async ({ ctx }) => {
    return ctx.db.staff.findMany({
      where: { workspaceId: ctx.session.workspaceId, activo: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        // Explicitly omit pinAccesoHash from listing.
      },
    })
  }),

  invite: doctorProcedure
    .input(
      z.object({
        cedula: z.string().min(6).max(10),
        nombre: z.string().min(2).max(80).regex(/^[\p{L}\s\-']+$/u, "Solo letras y espacios"),
        apellido: z.string().min(2).max(80).regex(/^[\p{L}\s\-']+$/u, "Solo letras y espacios"),
        email: z.string().email().max(254),
        // PIN policy: 6-8 digits, no monotonic / all-same.
        pin: pinSchema,
        rol: z.nativeEnum(StaffRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.staff.findFirst({
        where: {
          workspaceId: ctx.session.workspaceId,
          OR: [{ cedula: input.cedula }, { email: input.email.toLowerCase() }],
        },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe un miembro con esa cédula o email en este consultorio",
        })
      }
      const pinAccesoHash = await bcrypt.hash(input.pin, BCRYPT_COST)
      const staff = await ctx.db.staff.create({
        data: {
          cedula: input.cedula,
          nombre: input.nombre,
          apellido: input.apellido,
          email: input.email.toLowerCase().trim(),
          pinAccesoHash,
          rol: input.rol,
          workspaceId: ctx.session.workspaceId,
        },
        select: {
          id: true,
          cedula: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          activo: true,
        },
      })
      safeLog("info", "staff.invited", {
        staffId: staff.id,
        email: staff.email.slice(0, 3) + "***",
        invitedBy: ctx.session.id,
      })
      return staff
    }),

  deactivate: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.staff.updateMany({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
        data: { activo: false },
      })
      if (updated.count === 0) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }
      safeLog("info", "staff.deactivated", {
        staffId: input.id,
        by: ctx.session.id,
      })
      return { success: true }
    }),

  resetPin: doctorProcedure
    .input(z.object({ id: z.string(), newPin: pinSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.staff.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId, activo: true },
      })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })
      // Disallow PIN reuse.
      if (existing.pinAccesoHash) {
        const sameAsOld = await bcrypt.compare(input.newPin, existing.pinAccesoHash)
        if (sameAsOld) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "El nuevo PIN debe ser distinto al actual.",
          })
        }
      }
      const pinAccesoHash = await bcrypt.hash(input.newPin, BCRYPT_COST)
      await ctx.db.staff.update({ where: { id: input.id }, data: { pinAccesoHash } })
      safeLog("info", "staff.pin_reset", {
        staffId: input.id,
        by: ctx.session.id,
      })
      return { success: true }
    }),
})
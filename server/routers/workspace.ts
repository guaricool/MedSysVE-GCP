import { router, doctorProcedure, protectedProcedure } from "../trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { generateClinicInvitationCode } from "@/lib/clinic-invitation-code"

const estadoSchema = z.string().min(2).max(60)
const ciudadSchema = z.string().min(2).max(80)

export const workspaceRouter = router({
  myWorkspaces: doctorProcedure.query(async ({ ctx }) => {
    return ctx.db.workspace.findMany({
      where: { doctorId: ctx.session.doctorId },
      orderBy: { createdAt: "asc" },
    })
  }),

  create: doctorProcedure
    .input(
      z.object({
        nombre: z.string().min(2),
        direccion: z.string().optional(),
        telefono: z.string().optional(),
        rif: z.string().optional(),
        razonSocial: z.string().optional(),
        estado: estadoSchema.optional(),
        ciudad: ciudadSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workspace.create({
        data: { ...input, doctorId: ctx.session.doctorId },
      })
    }),

  update: doctorProcedure
    .input(
      z.object({
        id: z.string(),
        nombre: z.string().min(2).optional(),
        direccion: z.string().optional(),
        telefono: z.string().optional(),
        rif: z.string().optional(),
        razonSocial: z.string().optional(),
        estado: estadoSchema.optional(),
        ciudad: ciudadSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ws = await ctx.db.workspace.findFirst({
        where: { id: input.id, doctorId: ctx.session.doctorId },
      })
      if (!ws) throw new TRPCError({ code: "FORBIDDEN" })
      const { id, ...data } = input
      return ctx.db.workspace.update({ where: { id }, data })
    }),

  current: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.workspace.findUnique({
      where: { id: ctx.session.workspaceId },
      include: {
        doctor: {
          select: { nombre: true, apellido: true, especialidadPrincipal: true },
        },
        clinic: {
          select: {
            id: true,
            nombre: true,
            estado: true,
            ciudad: true,
            invitationCodes: {
              select: { id: true, code: true, used: true, createdAt: true },
              orderBy: { createdAt: "asc" }
            }
          },
        },
      },
    })
  }),

  updateBcvRate: doctorProcedure
    .input(z.object({ tasa: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workspace.update({
        where: { id: ctx.session.workspaceId },
        data: { tasaBcvActual: input.tasa, tasaBcvAt: new Date() },
      })
    }),

  updateSettings: doctorProcedure
    .input(
      z.object({
        nombre: z.string().min(2).optional(),
        direccion: z.string().optional(),
        telefono: z.string().optional(),
        rif: z.string().optional(),
        razonSocial: z.string().optional(),
        direccionFiscal: z.string().optional(),
        logoUrl: z.string().optional(),
        membreteUrl: z.string().optional(),
        estado: estadoSchema.optional(),
        ciudad: ciudadSchema.optional(),
        autoCreateHistoryOnEncounter: z.boolean().optional(),
        emailAppointmentReminders: z.boolean().optional(),
        allowedIps: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workspace.update({
        where: { id: ctx.session.workspaceId },
        data: input,
      })
    }),

  updateReminderConfig: doctorProcedure
    .input(
      z.object({
        recordatorioHoras: z.number().int().min(1).max(168).optional(),
        recordatorioWa: z.boolean().optional(),
        recordatorioEmail: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workspace.update({
        where: { id: ctx.session.workspaceId },
        data: input,
      })
    }),

  /**
   * Create a new Clinic under this doctor's ownership. Generates an
   * invitationCode automatically that the doctor can share with other
   * doctors to invite them to join via workspace.joinClinicByCode.
   *
   * Auto-associates the doctor's current workspace to the new clinic.
   */
  createClinic: doctorProcedure
    .input(
      z.object({
        nombre: z.string().min(2).max(120),
        rif: z.string().max(20).optional(),
        razonSocial: z.string().max(200).optional(),
        direccion: z.string().max(250).optional(),
        telefono: z.string().max(40).optional(),
        email: z.string().email().max(254).optional(),
        website: z.string().url().max(300).optional(),
        estado: estadoSchema,
        ciudad: ciudadSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Generate a unique invitation code; retry on collision (extremely rare).
      let invitationCode = generateClinicInvitationCode()
      for (let i = 0; i < 5; i++) {
        const exists = await ctx.db.clinicInvitationCode.findUnique({ where: { code: invitationCode } })
        if (!exists) break
        invitationCode = generateClinicInvitationCode()
      }

      const clinic = await ctx.db.clinic.create({
        data: {
          nombre: input.nombre,
          rif: input.rif,
          razonSocial: input.razonSocial,
          direccion: input.direccion,
          telefono: input.telefono,
          email: input.email,
          website: input.website,
          estado: input.estado,
          ciudad: input.ciudad,
          activa: true,
        },
      })

      const inviteCode = await ctx.db.clinicInvitationCode.create({
        data: { clinicId: clinic.id, code: invitationCode }
      })

      // Auto-associate this doctor's current workspace to the new clinic.
      await ctx.db.workspace.update({
        where: { id: ctx.session.workspaceId },
        data: { clinicId: clinic.id },
      })

      return { id: clinic.id, invitationCode }
    }),

  /**
   * Look up a clinic by invitation code WITHOUT joining it. Used by the UI
   * to show "Estás a punto de unirte a [Clínica X] en [Estado Y]" before the
   * doctor confirms.
   *
   * Audit S5 (2026-07-06): migrated from protectedProcedure to
   * doctorProcedure. Only doctors join clinics — PATIENT role shouldn't
   * be looking up clinic invitation codes.
   */
  peekClinicByCode: doctorProcedure
    .input(z.object({ code: z.string().min(6).max(40) }))
    .query(async ({ ctx, input }) => {
      const codeRecord = await ctx.db.clinicInvitationCode.findUnique({
        where: { code: input.code.trim().toUpperCase() },
        include: {
          clinic: {
            select: {
              id: true,
              nombre: true,
              estado: true,
              ciudad: true,
              activa: true,
            },
          }
        }
      })
      if (!codeRecord || codeRecord.used || !codeRecord.clinic.activa) return null
      return codeRecord.clinic
    }),

  /**
   * Join an existing clinic by invitation code. Creates a new workspace for
   * the doctor under this clinic (the doctor can keep using their old solo
   * workspace, OR switch). Returns the new workspaceId.
   */
  joinClinicByCode: doctorProcedure
    .input(
      z.object({
        code: z.string().min(6).max(40),
        workspaceNombre: z.string().min(2).max(120),
        estado: estadoSchema,
        ciudad: ciudadSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const codeStr = input.code.trim().toUpperCase()
      const codeRecord = await ctx.db.clinicInvitationCode.findUnique({
         where: { code: codeStr },
         include: { clinic: true }
      })
      if (!codeRecord || codeRecord.used || !codeRecord.clinic.activa) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Código de clínica inválido, ya usado, o clínica inactiva." })
      }
      
      const clinic = codeRecord.clinic

      const ws = await ctx.db.workspace.create({
        data: {
          nombre: input.workspaceNombre,
          doctorId: ctx.session.doctorId,
          clinicId: clinic.id,
          estado: input.estado,
          ciudad: input.ciudad,
        },
      })

      await ctx.db.clinicInvitationCode.update({
        where: { id: codeRecord.id },
        data: { used: true, usedById: ctx.session.doctorId }
      })

      return { workspaceId: ws.id, clinicId: clinic.id, clinicNombre: clinic.nombre }
    }),

  /**
   * Generate a new invitation code for the clinic. The doctor must own the
   * clinic (must be the workspace.clinicId where they are currently active).
   */
  regenerateClinicCode: doctorProcedure
    .input(z.object({ clinicId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the doctor has a workspace in this clinic.
      const ws = await ctx.db.workspace.findFirst({
        where: {
          clinicId: input.clinicId,
          doctorId: ctx.session.doctorId,
        },
      })
      if (!ws) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes acceso a esta clínica." })

      let code = generateClinicInvitationCode()
      for (let i = 0; i < 5; i++) {
        const exists = await ctx.db.clinicInvitationCode.findUnique({ where: { code } })
        if (!exists) break
        code = generateClinicInvitationCode()
      }
      // This was for the old 1-code model. Here we just create one new code.
      // We don't delete others to be safe.
      const codeRecord = await ctx.db.clinicInvitationCode.create({
        data: {
          clinicId: input.clinicId,
          code,
        }
      })
      return { invitationCode: codeRecord.code }
    }),
})

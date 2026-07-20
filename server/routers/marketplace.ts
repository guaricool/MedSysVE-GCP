import { z } from "zod"
import { TRPCError } from "@trpc/server"
import bcrypt from "bcryptjs"
import { router, publicProcedure } from "../trpc"
import { BCRYPT_COST, portalPasswordSchema } from "@/lib/password-policy"

export const marketplaceRouter = router({
  registerPortalUser: publicProcedure
    .input(z.object({
      nombre: z.string().min(1),
      apellido: z.string().min(1),
      telefono: z.string().min(1),
      email: z.string().email(),
      password: portalPasswordSchema,
      tipoIdentificacion: z.enum(["CEDULA_V", "CEDULA_E", "PASAPORTE"]).optional(),
      numeroIdentificacion: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Check if user already exists
      const existing = await ctx.db.portalUser.findFirst({
        where: {
          OR: [
            { email: input.email },
            { telefono: input.telefono }
          ]
        }
      })
      
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Ya existe un usuario con ese correo o teléfono." })
      }

      // 2. Hash password
      const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST)

      // 3. Create PortalUser and GlobalPatientProfile
      const user = await ctx.db.portalUser.create({
        data: {
          email: input.email,
          telefono: input.telefono,
          passwordHash,
          patientProfile: {
            create: {
              nombre: input.nombre,
              apellido: input.apellido,
              tipoIdentificacion: input.tipoIdentificacion,
              numeroIdentificacion: input.numeroIdentificacion,
            }
          }
        },
        include: {
          patientProfile: true
        }
      })

      return { success: true, userId: user.id }
    }),

  initiateVerification: publicProcedure
    .input(z.object({
      userId: z.string(),
      method: z.enum(["WHATSAPP", "EMAIL"])
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.portalUser.findUnique({ where: { id: input.userId } })
      if (!user) throw new TRPCError({ code: "NOT_FOUND" })

      // Generate a short code for the intent e.g. VERIFICAR-8291
      const shortCode = `VERIFICAR-${Math.floor(1000 + Math.random() * 9000)}`
      
      const intent = await ctx.db.verificationIntent.create({
        data: {
          codigo: shortCode,
          method: input.method,
          portalUserId: user.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
        }
      })

      return { intentId: intent.id, codigo: shortCode }
    }),

  verifyOtp: publicProcedure
    .input(z.object({
      intentId: z.string(),
      otp: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const intent = await ctx.db.verificationIntent.findUnique({
        where: { id: input.intentId }
      })

      if (!intent || intent.expiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El código ha expirado o no existe." })
      }

      if (intent.otp !== input.otp) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "El OTP es incorrecto." })
      }

      // Mark user as verified
      await ctx.db.portalUser.update({
        where: { id: intent.portalUserId },
        data: { isVerified: true }
      })

      return { success: true }
    }),

  searchDoctors: publicProcedure
    .input(z.object({
      estado: z.string().optional(),
      ciudad: z.string().optional(),
      especialidad: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const doctors = await ctx.db.doctor.findMany({
        where: {
          ...(input.especialidad && { especialidadPrincipal: input.especialidad }),
          workspaces: {
            some: {
              ...(input.estado && { estado: input.estado }),
              ...(input.ciudad && { ciudad: input.ciudad }),
            }
          }
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          especialidadPrincipal: true,
          fotoUrl: true,
          bio: true,
          workspaces: {
            where: {
              ...(input.estado && { estado: input.estado }),
              ...(input.ciudad && { ciudad: input.ciudad }),
            },
            select: {
              id: true,
              nombre: true,
              direccion: true,
              estado: true,
              ciudad: true,
            }
          }
        }
      })
      
      return doctors
    }),

  getDoctorAvailability: publicProcedure
    .input(z.object({
      workspaceId: z.string(),
      date: z.string() // "YYYY-MM-DD"
    }))
    .query(async ({ ctx, input }) => {
      const { workspaceId, date } = input
      const targetDate = new Date(`${date}T12:00:00`)
      const diaSemana = targetDate.getDay() // 0=Dom, 1=Lun, ..., 6=Sab

      const availability = await ctx.db.doctorAvailability.findUnique({
        where: {
          workspaceId_diaSemana: {
            workspaceId,
            diaSemana
          }
        }
      })

      if (!availability || !availability.activo) {
        return { slots: [] } // Doctor doesn't work on this day
      }

      // Find existing appointments for this day
      const startOfDay = new Date(`${date}T00:00:00-04:00`)
      const endOfDay = new Date(`${date}T23:59:59-04:00`)
      const existing = await ctx.db.appointment.findMany({
        where: {
          workspaceId,
          fechaHora: { gte: startOfDay, lte: endOfDay },
          status: { in: ["REQUESTED", "SCHEDULED", "CONFIRMED"] }
        },
        select: { fechaHora: true, duracionMinutos: true }
      })

      // Generate slots
      const slots: string[] = []
      const [startH, startM] = availability.horaInicio.split(":").map(Number)
      const [endH, endM] = availability.horaFin.split(":").map(Number)
      
      const startTimeMinutes = startH * 60 + startM
      const endTimeMinutes = endH * 60 + endM
      const step = availability.duracionMinutos || 30

      for (let time = startTimeMinutes; time + step <= endTimeMinutes; time += step) {
        const h = Math.floor(time / 60)
        const m = time % 60
        const slotTimeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        
        // Construct the slot Date object in Venezuela time
        const slotDate = new Date(`${date}T${slotTimeStr}:00-04:00`)

        // Check if there is an overlapping appointment
        // Simplified check: is there any appointment that starts exactly at this time?
        const isTaken = existing.some(appt => {
          const apptTime = appt.fechaHora.getTime()
          const slotTime = slotDate.getTime()
          // Check if slot starts during the appointment, or appointment starts during the slot
          const apptEndTime = apptTime + (appt.duracionMinutos * 60 * 1000)
          const slotEndTime = slotTime + (step * 60 * 1000)
          
          return (slotTime >= apptTime && slotTime < apptEndTime) || (apptTime >= slotTime && apptTime < slotEndTime)
        })

        if (!isTaken) {
          slots.push(slotTimeStr)
        }
      }

      return { slots }
    })
})

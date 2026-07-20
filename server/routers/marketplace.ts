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
      // Check if user already exists (by email or phone)
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
      return { success: true }
    }),

  initiateVerification: publicProcedure
    .input(z.object({
      userId: z.string().optional(),
      method: z.enum(["WHATSAPP", "EMAIL"]),
      registrationData: z.object({
        nombre: z.string().min(1),
        apellido: z.string().min(1),
        telefono: z.string().min(1),
        email: z.string().email(),
        password: portalPasswordSchema,
        tipoIdentificacion: z.enum(["CEDULA_V", "CEDULA_E", "PASAPORTE"]).optional(),
        numeroIdentificacion: z.string().optional(),
      }).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.userId && !input.registrationData) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Se requiere userId o registrationData." })
      }

      // Generate a short code for the intent e.g. VERIFICAR-8291
      const shortCode = `VERIFICAR-${Math.floor(1000 + Math.random() * 9000)}`

      let serializedRegistrationData: string | null = null
      let targetEmail: string | null = null

      if (input.registrationData) {
        const { email, telefono, password } = input.registrationData
        // Double check uniqueness
        const existing = await ctx.db.portalUser.findFirst({
          where: {
            OR: [
              { email },
              { telefono }
            ]
          }
        })
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Ya existe un usuario con ese correo o teléfono." })
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_COST)
        serializedRegistrationData = JSON.stringify({
          ...input.registrationData,
          passwordHash
        })
        targetEmail = email
      } else if (input.userId) {
        const user = await ctx.db.portalUser.findUnique({ where: { id: input.userId } })
        if (!user) throw new TRPCError({ code: "NOT_FOUND" })
        targetEmail = user.email
      }

      let otp: string | null = null
      if (input.method === "EMAIL") {
        if (!targetEmail) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "El usuario no tiene una dirección de correo válida." })
        }
        otp = Math.floor(100000 + Math.random() * 900000).toString()
        const { sendOtpEmail } = await import("@/lib/email")
        await sendOtpEmail({
          to: targetEmail,
          code: otp,
          purpose: "EMAIL_VERIFY",
          expiresInMinutes: 15
        })
      }

      const intent = await ctx.db.verificationIntent.create({
        data: {
          codigo: shortCode,
          otp,
          method: input.method,
          portalUserId: input.userId || null,
          registrationData: serializedRegistrationData,
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

      if (intent.registrationData) {
        const regData = JSON.parse(intent.registrationData)
        
        // Double check uniqueness to prevent race condition
        const existing = await ctx.db.portalUser.findFirst({
          where: {
            OR: [
              { email: regData.email },
              { telefono: regData.telefono }
            ]
          }
        })
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Ya existe un usuario con ese correo o teléfono." })
        }

        // Create PortalUser and GlobalPatientProfile at once
        await ctx.db.portalUser.create({
          data: {
            email: regData.email,
            telefono: regData.telefono,
            passwordHash: regData.passwordHash,
            isVerified: true,
            patientProfile: {
              create: {
                nombre: regData.nombre,
                apellido: regData.apellido,
                tipoIdentificacion: regData.tipoIdentificacion,
                numeroIdentificacion: regData.numeroIdentificacion,
              }
            }
          }
        })
      } else if (intent.portalUserId) {
        // Mark existing user as verified
        await ctx.db.portalUser.update({
          where: { id: intent.portalUserId },
          data: { isVerified: true }
        })
      }

      // Cleanup intent after successful verification
      await ctx.db.verificationIntent.delete({
        where: { id: intent.id }
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

      const isDefaultWorkday = diaSemana >= 1 && diaSemana <= 5 // Mon-Fri
      const finalAvailability = availability || {
        id: "default",
        workspaceId,
        diaSemana,
        horaInicio: "08:00",
        horaFin: "17:00",
        duracionMinutos: 30,
        activo: isDefaultWorkday,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!finalAvailability.activo) {
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
      const [startH, startM] = finalAvailability.horaInicio.split(":").map(Number)
      const [endH, endM] = finalAvailability.horaFin.split(":").map(Number)
      
      const startTimeMinutes = startH * 60 + startM
      const endTimeMinutes = endH * 60 + endM
      const step = finalAvailability.duracionMinutos || 30

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
    }),

  checkPortalUserStatus: publicProcedure
    .input(z.object({
      identifier: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      let portalUser = await ctx.db.portalUser.findFirst({
        where: { email: input.identifier }
      })
      if (!portalUser) {
        portalUser = await ctx.db.portalUser.findFirst({
          where: { telefono: input.identifier }
        })
      }

      if (!portalUser) {
        return { exists: false, isVerified: false, userId: null, email: null, telefono: null }
      }

      return {
        exists: true,
        isVerified: portalUser.isVerified,
        userId: portalUser.id,
        email: portalUser.email,
        telefono: portalUser.telefono
      }
    })
})

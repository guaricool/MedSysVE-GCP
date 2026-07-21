import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const rheumaRouter = router({
  // ─── 1. HOMÚNCULO ARTICULAR (28-JOINT MAPPER TJC28/SJC28) ───
  getJointMapper: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-rheuma-joint-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          tenderJointCount28: 6,
          swollenJointCount28: 4,
          patientGlobalVasMm: 65,
          evaluatorGlobalVasMm: 50,
          jointDetailsJson: JSON.stringify({
            tender: ["mcp2_right", "mcp3_right", "pip2_left", "pip3_left", "wrist_right", "knee_left"],
            swollen: ["mcp2_right", "mcp3_right", "wrist_right", "knee_left"],
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.rheumaJointMapper.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveJointMapper: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        tenderJointCount28: z.number().int().min(0).max(28),
        swollenJointCount28: z.number().int().min(0).max(28),
        patientGlobalVasMm: z.number().int().min(0).max(100),
        evaluatorGlobalVasMm: z.number().int().min(0).max(100).optional().nullable(),
        jointDetailsJson: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-rheuma-joint-1" }
      }

      const existing = await ctx.db.rheumaJointMapper.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        tenderJointCount28: input.tenderJointCount28,
        swollenJointCount28: input.swollenJointCount28,
        patientGlobalVasMm: input.patientGlobalVasMm,
        evaluatorGlobalVasMm: input.evaluatorGlobalVasMm,
        jointDetailsJson: input.jointDetailsJson,
      }

      if (existing) {
        return ctx.db.rheumaJointMapper.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.rheumaJointMapper.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. CALCULADORA DE ÍNDICES DE ACTIVIDAD (DAS28 / CDAI / SDAI) ───
  getActivityScores: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-rheuma-score-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          crpMgL: 14.5,
          esrMmHr: 38.0,
          das28Score: 4.62,
          cdaiScore: 21.5,
          sdaiScore: 24.2,
          activityCategory: "Actividad Moderada (CDAI 10.1 - 22.0)",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.rheumaActivityScores.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveActivityScores: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        crpMgL: z.number().positive().optional().nullable(),
        esrMmHr: z.number().positive().optional().nullable(),
        das28Score: z.number().positive().optional().nullable(),
        cdaiScore: z.number().min(0).max(76),
        sdaiScore: z.number().positive().optional().nullable(),
        activityCategory: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-rheuma-score-1" }
      }

      const existing = await ctx.db.rheumaActivityScores.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        crpMgL: input.crpMgL,
        esrMmHr: input.esrMmHr,
        das28Score: input.das28Score,
        cdaiScore: input.cdaiScore,
        sdaiScore: input.sdaiScore,
        activityCategory: input.activityCategory,
      }

      if (existing) {
        return ctx.db.rheumaActivityScores.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.rheumaActivityScores.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 3. ARTROPATÍAS POST-VIRALES TROPICALES (CHIKUNGUNYA/ZIKA/DENGUE) ───
  getPostViralArthritis: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-rheuma-viral-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          viralEtiology: "Chikungunya (Serología positiva IgG / Brote previo)",
          faseEvolucion: "Crónica (>12 semanas post-infección)",
          patronArticular: "Poliartritis simétrica de pequeñas articulaciones de manos y tobillos con tenosinovitis de flexores.",
          tratamientoPrevio: "AINEs (Ibuprofeno) + Prednisona 5mg/día con respuesta parcial.",
          respuestaTratamiento: "Respuesta Parcial con persistencia de rigidez matutina >45 min.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.rheumaPostViralArthritis.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  savePostViralArthritis: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        viralEtiology: z.string(),
        faseEvolucion: z.string(),
        patronArticular: z.string(),
        tratamientoPrevio: z.string().optional().nullable(),
        respuestaTratamiento: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-rheuma-viral-1" }
      }

      const existing = await ctx.db.rheumaPostViralArthritis.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        viralEtiology: input.viralEtiology,
        faseEvolucion: input.faseEvolucion,
        patronArticular: input.patronArticular,
        tratamientoPrevio: input.tratamientoPrevio,
        respuestaTratamiento: input.respuestaTratamiento,
      }

      if (existing) {
        return ctx.db.rheumaPostViralArthritis.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.rheumaPostViralArthritis.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})

import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const traumaRouter = router({
  // ─── 1. IMPLANTES Y MATERIAL DE OSTEOSÍNTESIS ───
  listImplantes: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return [
          {
            id: "sandbox-implante-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            tipoMaterial: "Placa Bloqueada de Titanio 3.5mm",
            marca: "Synthes (DePuy Synthes)",
            modelo: "LCP Tibia Proximal",
            lote: "LOT-984214-A",
            material: "Titanio (Ti-6Al-4V)",
            zonaAnatomica: "Tibia Proximal Izquierda",
            cantidad: 1,
            observaciones: "Fijación anatómica con 6 tornillos bloqueados.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "sandbox-implante-2",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            tipoMaterial: "Tornillo Cortical 3.5mm",
            marca: "Synthes (DePuy Synthes)",
            modelo: "StarDrive T15",
            lote: "LOT-984215-B",
            material: "Titanio",
            zonaAnatomica: "Tibia Proximal Izquierda",
            cantidad: 6,
            observaciones: "Tornillos de bloqueo metafisario.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      try {
        if (!(ctx.db as any).traumaImplante) return []
        return await (ctx.db as any).traumaImplante.findMany({
          where: { encounterId: input.encounterId },
          orderBy: { createdAt: "asc" },
        })
      } catch (err) {
        return []
      }
    }),

  addImplante: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        tipoMaterial: z.string(),
        marca: z.string(),
        modelo: z.string().optional().nullable(),
        lote: z.string(),
        material: z.string().optional().nullable(),
        zonaAnatomica: z.string(),
        cantidad: z.number().int().min(1).default(1),
        observaciones: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: `sandbox-implante-${Date.now()}`,
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      const created = await ctx.db.traumaImplante.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          tipoMaterial: input.tipoMaterial,
          marca: input.marca,
          modelo: input.modelo,
          lote: input.lote,
          material: input.material,
          zonaAnatomica: input.zonaAnatomica,
          cantidad: input.cantidad,
          observaciones: input.observaciones,
        },
      })

      void audit("UPDATE_ENCOUNTER", {
        userId: ctx.session.id,
        userRole: ctx.session.role,
        workspaceId: ctx.session.workspaceId,
        resourceType: "TraumaImplante",
        resourceId: created.id,
        patientId: input.patientRegistrationId,
      })

      return created
    }),

  deleteImplante: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id.startsWith("sandbox-implante-")) {
        return { ok: true }
      }

      await ctx.db.traumaImplante.delete({
        where: { id: input.id },
      })
      return { ok: true }
    }),

  // ─── 2. CLASIFICACIÓN AO / OTA ───
  getAoClassification: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-ao-1",
          encounterId: "sandbox-demo",
          hueso: "Fémur [3]",
          segmento: "Distal [3]",
          codigoAO: "33-C2",
          descripcion: "Fractura articular completa articular y metafisaria conminuta",
          mecanismoLesion: "Accidente de tránsito de alta energía",
          createdAt: new Date(),
        }
      }

      try {
        if (!(ctx.db as any).traumaAoClassification) return null
        return await (ctx.db as any).traumaAoClassification.findFirst({
          where: { encounterId: input.encounterId },
        })
      } catch (err) {
        return null
      }
    }),

  saveAoClassification: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        hueso: z.string(),
        segmento: z.string(),
        codigoAO: z.string(),
        descripcion: z.string(),
        mecanismoLesion: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-ao-1" }
      }

      const existing = await (ctx.db as any).traumaAoClassification?.findFirst({
        where: { encounterId: input.encounterId },
      })

      if (existing) {
        return (ctx.db as any).traumaAoClassification.update({
          where: { id: existing.id },
          data: {
            hueso: input.hueso,
            segmento: input.segmento,
            codigoAO: input.codigoAO,
            descripcion: input.descripcion,
            mecanismoLesion: input.mecanismoLesion,
          },
        })
      }

      return (ctx.db as any).traumaAoClassification.create({
        data: {
          encounterId: input.encounterId,
          hueso: input.hueso,
          segmento: input.segmento,
          codigoAO: input.codigoAO,
          descripcion: input.descripcion,
          mecanismoLesion: input.mecanismoLesion,
        },
      })
    }),

  // ─── 3. PROTOCOLO DE REHABILITACIÓN & CARGA DE PESO ───
  getRehabProtocol: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-rehab-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          nivelCarga: "CARGA_PARCIAL_50",
          usoOrtesis: "Bota Walker con descarga + Muletas axilares",
          faseRehab: "Fase II: Movilización Pasiva & Carga Parcial (Semanas 2-6)",
          ejerciciosPermitidos: "Movilización pasiva asistida de rodilla 0-90°, isométricos de cuádriceps.",
          contraindicaciones: "Carga de peso completa no autorizada. Evitar rotación externa forzada.",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      try {
        if (!(ctx.db as any).traumaRehabProtocol) return null
        return await (ctx.db as any).traumaRehabProtocol.findFirst({
          where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
        })
      } catch (err) {
        return null
      }
    }),

  saveRehabProtocol: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        nivelCarga: z.string(),
        usoOrtesis: z.string().optional().nullable(),
        faseRehab: z.string(),
        ejerciciosPermitidos: z.string().optional().nullable(),
        contraindicaciones: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-rehab-1" }
      }

      const existing = await ctx.db.traumaRehabProtocol.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        nivelCarga: input.nivelCarga,
        usoOrtesis: input.usoOrtesis,
        faseRehab: input.faseRehab,
        ejerciciosPermitidos: input.ejerciciosPermitidos,
        contraindicaciones: input.contraindicaciones,
      }

      if (existing) {
        return ctx.db.traumaRehabProtocol.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.traumaRehabProtocol.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),
})

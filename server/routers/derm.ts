import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const dermRouter = router({
  // ─── 1. FOTOTIPO CUTÁNEO FITZPATRICK & PERFIL FOTOPROTECCIÓN ───
  getSkinProfile: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return {
          id: "sandbox-derm-skin-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          fitzpatrickType: "Tipo II (Piel clara, se quema fácilmente, se broncea mínimamente)",
          antecedentesCancerPiel: false,
          historiaQuemadurasSolares: "Quemaduras solares leves en infancia durante exposición recreativa.",
          usoFotoprotector: "Uso diario de fotoprotector solar FPS 50+",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      return ctx.db.dermSkinProfile.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })
    }),

  saveSkinProfile: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        fitzpatrickType: z.string(),
        antecedentesCancerPiel: z.boolean().default(false),
        historiaQuemadurasSolares: z.string().optional().nullable(),
        usoFotoprotector: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-derm-skin-1" }
      }

      const existing = await ctx.db.dermSkinProfile.findFirst({
        where: { encounterId: input.encounterId, workspaceId: ctx.session.workspaceId },
      })

      const data = {
        fitzpatrickType: input.fitzpatrickType,
        antecedentesCancerPiel: input.antecedentesCancerPiel,
        historiaQuemadurasSolares: input.historiaQuemadurasSolares,
        usoFotoprotector: input.usoFotoprotector,
      }

      if (existing) {
        return ctx.db.dermSkinProfile.update({
          where: { id: existing.id },
          data,
        })
      }

      return ctx.db.dermSkinProfile.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          ...data,
        },
      })
    }),

  // ─── 2. MAPEO DE LESIONES CUTÁNEAS Y CRITERIOS ABCDE DE MELANOMA ───
  listLesions: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-lesion-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            localizacion: "Espalda Superior Derecha (Región Escapular)",
            asimetriaAbcde: false,
            bordesIrregularesAbcde: false,
            colorVariadoAbcde: false,
            diametroMayorMm: 4.5,
            evolucionCambiosAbcde: false,
            dermatoscopiaPatron: "Red pigmentada típica y homogénea",
            diagnosticoPresuntivo: "Nevus Melánico Benigno",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.dermLesionRecord.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveLesion: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        localizacion: z.string(),
        asimetriaAbcde: z.boolean().default(false),
        bordesIrregularesAbcde: z.boolean().default(false),
        colorVariadoAbcde: z.boolean().default(false),
        diametroMayorMm: z.number().positive().optional().nullable(),
        evolucionCambiosAbcde: z.boolean().default(false),
        dermatoscopiaPatron: z.string().optional().nullable(),
        diagnosticoPresuntivo: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-lesion-1" }
      }

      return ctx.db.dermLesionRecord.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          localizacion: input.localizacion,
          asimetriaAbcde: input.asimetriaAbcde,
          bordesIrregularesAbcde: input.bordesIrregularesAbcde,
          colorVariadoAbcde: input.colorVariadoAbcde,
          diametroMayorMm: input.diametroMayorMm,
          evolucionCambiosAbcde: input.evolucionCambiosAbcde,
          dermatoscopiaPatron: input.dermatoscopiaPatron,
          diagnosticoPresuntivo: input.diagnosticoPresuntivo,
        },
      })
    }),

  // ─── 3. FICHA DE BIOPSIAS CUTÁNEAS Y RESULTADO HISTOPATOLÓGICO ───
  listBiopsies: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-biopsy-1",
            encounterId: "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            sitioBiopsia: "Hombro Izquierdo",
            tipoBiopsia: "Punch (Sacabocados 4mm)",
            indicacion: "Lesión hiperqueratósica sospechosa de Carcinoma Espinocelular",
            resultadoHistopatologico: "Queratosis Actínica con atipia citológica focal en capa basal. Márgenes libres.",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      }

      return ctx.db.dermBiopsyRecord.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
        orderBy: { createdAt: "desc" },
      })
    }),

  saveBiopsy: protectedProcedure
    .input(
      z.object({
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        sitioBiopsia: z.string(),
        tipoBiopsia: z.string(),
        indicacion: z.string().optional().nullable(),
        resultadoHistopatologico: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.encounterId === "sandbox-demo") {
        return { ok: true, id: "sandbox-biopsy-1" }
      }

      return ctx.db.dermBiopsyRecord.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          workspaceId: ctx.session.workspaceId,
          sitioBiopsia: input.sitioBiopsia,
          tipoBiopsia: input.tipoBiopsia,
          indicacion: input.indicacion,
          resultadoHistopatologico: input.resultadoHistopatologico,
        },
      })
    }),
})

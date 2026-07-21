import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { audit } from "@/lib/audit"

export const dicomRouter = router({
  // ─── 1. LISTAR ESTUDIOS DICOM DEL PACIENTE ───
  listPatientStudies: protectedProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        encounterId: z.string().optional(),
        modality: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return [
          {
            id: "sandbox-dicom-study-1",
            encounterId: input.encounterId ?? "sandbox-demo",
            patientRegistrationId: "sandbox-demo-pat",
            workspaceId: ctx.session.workspaceId ?? "sandbox",
            studyInstanceUid: "1.2.840.113619.2.55.3.2831151000.451.17200928.1",
            patientIdDicom: "PAT-2026-8819",
            patientNameDicom: "CARLOS PIERLUISSI",
            studyDate: new Date(),
            studyTime: "10:30:00",
            modality: input.modality ?? "CT",
            studyDescription: "TAC TÓRAX / ABDOMEN MULTISLICE CON CONTRASTE",
            referringPhysician: "DR. GUARIUCO PIERLUISSI",
            numberOfSeries: 3,
            numberOfInstances: 140,
            gcsBucket: "medsysve-dicom-pacs",
            gcsFolderPath: "studies/1.2.840.113619.2.55.3.2831151000.451.17200928.1/",
            createdAt: new Date(),
            updatedAt: new Date(),
            series: [
              {
                id: "sandbox-dicom-series-1",
                studyId: "sandbox-dicom-study-1",
                seriesInstanceUid: "1.2.840.113619.2.55.3.2831151000.451.17200928.2",
                seriesNumber: 1,
                modality: "CT",
                seriesDescription: "CORTES AXIALES 1.25mm LUNG WINDOW",
                numberOfInstances: 70,
                images: [
                  {
                    id: "sandbox-dicom-img-1",
                    seriesId: "sandbox-dicom-series-1",
                    sopInstanceUid: "1.2.840.113619.2.55.3.2831151000.451.17200928.3",
                    instanceNumber: 1,
                    storageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
                    frameRate: null,
                    rows: 512,
                    columns: 512,
                    windowCenter: -600,
                    windowWidth: 1500,
                  },
                ],
              },
            ],
          },
        ]
      }

      const where: any = {
        patientRegistrationId: input.patientRegistrationId,
        workspaceId: ctx.session.workspaceId,
      }

      if (input.encounterId) {
        where.encounterId = input.encounterId
      }

      if (input.modality) {
        where.modality = input.modality
      }

      return ctx.db.dicomStudy.findMany({
        where,
        include: {
          series: {
            include: {
              images: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ─── 2. OBTENER DETALLE DE UN ESTUDIO CON SUS SERIES E IMÁGENES ───
  getStudyDetails: protectedProcedure
    .input(z.object({ studyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.studyId === "sandbox-dicom-study-1") {
        return {
          id: "sandbox-dicom-study-1",
          encounterId: "sandbox-demo",
          patientRegistrationId: "sandbox-demo-pat",
          workspaceId: ctx.session.workspaceId ?? "sandbox",
          studyInstanceUid: "1.2.840.113619.2.55.3.2831151000.451.17200928.1",
          patientIdDicom: "PAT-2026-8819",
          patientNameDicom: "CARLOS PIERLUISSI",
          studyDate: new Date(),
          studyTime: "10:30:00",
          modality: "CT",
          studyDescription: "TAC TÓRAX / ABDOMEN MULTISLICE CON CONTRASTE",
          referringPhysician: "DR. GUARIUCO PIERLUISSI",
          numberOfSeries: 3,
          numberOfInstances: 140,
          gcsBucket: "medsysve-dicom-pacs",
          gcsFolderPath: "studies/1.2.840.113619.2.55.3.2831151000.451.17200928.1/",
          createdAt: new Date(),
          updatedAt: new Date(),
          series: [
            {
              id: "sandbox-dicom-series-1",
              studyId: "sandbox-dicom-study-1",
              seriesInstanceUid: "1.2.840.113619.2.55.3.2831151000.451.17200928.2",
              seriesNumber: 1,
              modality: "CT",
              seriesDescription: "CORTES AXIALES 1.25mm LUNG WINDOW",
              numberOfInstances: 70,
              images: [
                {
                  id: "sandbox-dicom-img-1",
                  seriesId: "sandbox-dicom-series-1",
                  sopInstanceUid: "1.2.840.113619.2.55.3.2831151000.451.17200928.3",
                  instanceNumber: 1,
                  storageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
                  frameRate: null,
                  rows: 512,
                  columns: 512,
                  windowCenter: -600,
                  windowWidth: 1500,
                },
              ],
            },
          ],
        }
      }

      const study = await ctx.db.dicomStudy.findFirst({
        where: { id: input.studyId, workspaceId: ctx.session.workspaceId },
        include: {
          series: {
            include: {
              images: true,
            },
          },
        },
      })

      if (!study) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Estudio DICOM no encontrado" })
      }

      return study
    }),

  // ─── 3. REGISTRAR O VINCULAR UN NUEVO ESTUDIO DICOM ───
  createStudy: protectedProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        encounterId: z.string().optional().nullable(),
        studyInstanceUid: z.string(),
        patientIdDicom: z.string().optional().nullable(),
        patientNameDicom: z.string().optional().nullable(),
        modality: z.string(),
        studyDescription: z.string().optional().nullable(),
        referringPhysician: z.string().optional().nullable(),
        numberOfSeries: z.number().int().default(1),
        numberOfInstances: z.number().int().default(1),
        gcsBucket: z.string().optional().nullable(),
        gcsFolderPath: z.string().optional().nullable(),
        seriesData: z.array(
          z.object({
            seriesInstanceUid: z.string(),
            seriesNumber: z.number().int().optional().nullable(),
            modality: z.string(),
            seriesDescription: z.string().optional().nullable(),
            numberOfInstances: z.number().int().default(1),
            imagesData: z.array(
              z.object({
                sopInstanceUid: z.string(),
                instanceNumber: z.number().int().optional().nullable(),
                storageUrl: z.string(),
                frameRate: z.number().optional().nullable(),
                rows: z.number().int().optional().nullable(),
                columns: z.number().int().optional().nullable(),
                windowCenter: z.number().optional().nullable(),
                windowWidth: z.number().optional().nullable(),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.patientRegistrationId === "sandbox-demo-pat") {
        return { ok: true, id: "sandbox-dicom-study-1" }
      }

      const createdStudy = await ctx.db.dicomStudy.create({
        data: {
          patientRegistrationId: input.patientRegistrationId,
          encounterId: input.encounterId,
          workspaceId: ctx.session.workspaceId,
          studyInstanceUid: input.studyInstanceUid,
          patientIdDicom: input.patientIdDicom,
          patientNameDicom: input.patientNameDicom,
          modality: input.modality,
          studyDescription: input.studyDescription,
          referringPhysician: input.referringPhysician,
          numberOfSeries: input.numberOfSeries,
          numberOfInstances: input.numberOfInstances,
          gcsBucket: input.gcsBucket,
          gcsFolderPath: input.gcsFolderPath,
          series: {
            create: input.seriesData.map((s) => ({
              seriesInstanceUid: s.seriesInstanceUid,
              seriesNumber: s.seriesNumber,
              modality: s.modality,
              seriesDescription: s.seriesDescription,
              numberOfInstances: s.numberOfInstances,
              images: {
                create: s.imagesData.map((img) => ({
                  sopInstanceUid: img.sopInstanceUid,
                  instanceNumber: img.instanceNumber,
                  storageUrl: img.storageUrl,
                  frameRate: img.frameRate,
                  rows: img.rows,
                  columns: img.columns,
                  windowCenter: img.windowCenter,
                  windowWidth: img.windowWidth,
                })),
              },
            })),
          },
        },
        include: {
          series: {
            include: {
              images: true,
            },
          },
        },
      })

      return createdStudy
    }),
})

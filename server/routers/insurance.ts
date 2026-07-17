import { z } from "zod"
import { router, protectedProcedure, doctorProcedure } from "../trpc"

// Audit S7 (2026-07-06): listProviders migrated from protectedProcedure
// to doctorProcedure. Provider catalog is doctor-administered clinical
// configuration. Patient-insurance operations (listPatientInsurances,
// addPatientInsurance, updatePatientInsurance) remain protectedProcedure
// because patients use them through the portal to manage their own
// coverage.
export const insuranceRouter = router({
  // --- Proveedores ---

  listProviders: doctorProcedure.query(async ({ ctx }) => {
    let providers = await (ctx.db as any).insuranceProvider.findMany({
      where: { workspaceId: ctx.session.workspaceId },
      orderBy: { nombre: "asc" },
    })

    if (providers.length === 0) {
      const defaultProviders = [
        { nombre: "Mercantil Seguros", codigo: "MERCANTIL" },
        { nombre: "Seguros Caracas", codigo: "CARACAS" },
        { nombre: "Mapfre Venezuela", codigo: "MAPFRE" },
        { nombre: "Banesco Seguros", codigo: "BANESCO" },
        { nombre: "Seguros Pirámide", codigo: "PIRAMIDE" },
        { nombre: "Seguros Constitución", codigo: "CONSTITUCION" },
        { nombre: "La Occidental de Seguros", codigo: "OCCIDENTAL" },
        { nombre: "Seguros Horizonte", codigo: "HORIZONTE" },
        { nombre: "Seguros Altamira", codigo: "ALTAMIRA" },
        { nombre: "Hispana de Seguros", codigo: "HISPANA" },
      ]

      await (ctx.db as any).insuranceProvider.createMany({
        data: defaultProviders.map((p) => ({
          workspaceId: ctx.session.workspaceId,
          nombre: p.nombre,
          codigo: p.codigo,
        })),
      })

      providers = await (ctx.db as any).insuranceProvider.findMany({
        where: { workspaceId: ctx.session.workspaceId },
        orderBy: { nombre: "asc" },
      })
    }

    return providers
  }),

  createProvider: doctorProcedure
    .input(
      z.object({
        nombre: z.string().min(1),
        codigo: z.string().optional(),
        telefono: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return (ctx.db as any).insuranceProvider.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          nombre: input.nombre,
          codigo: input.codigo ?? null,
          telefono: input.telefono ?? null,
          email: input.email || null,
        },
      })
    }),

  updateProvider: doctorProcedure
    .input(
      z.object({
        id: z.string(),
        nombre: z.string().min(1).optional(),
        codigo: z.string().optional(),
        telefono: z.string().optional(),
        email: z.string().optional(),
        activo: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const existing = await (ctx.db as any).insuranceProvider.findFirst({
        where: { id, workspaceId: ctx.session.workspaceId },
      })
      if (!existing) throw new Error("Proveedor no encontrado")
      return (ctx.db as any).insuranceProvider.update({
        where: { id },
        data,
      })
    }),

  // --- Seguros del paciente ---

  listPatientInsurances: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!patient) throw new Error("Paciente no encontrado")
      const insurances = await (ctx.db as any).patientInsurance.findMany({
        where: { patientRegistrationId: input.patientRegistrationId },
        include: { provider: true },
        orderBy: { createdAt: "desc" },
      })
      return insurances
    }),

  addPatientInsurance: protectedProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        providerId: z.string(),
        numeroPóliza: z.string().min(1),
        titular: z.string().optional(),
        coberturaPct: z.number().int().min(0).max(100).default(100),
        fechaVigencia: z.string().optional(),
        notas: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!patient) throw new Error("Paciente no encontrado")
      const provider = await (ctx.db as any).insuranceProvider.findFirst({
        where: { id: input.providerId, workspaceId: ctx.session.workspaceId },
      })
      if (!provider) throw new Error("Proveedor no encontrado")
      return (ctx.db as any).patientInsurance.create({
        data: {
          patientRegistrationId: input.patientRegistrationId,
          providerId: input.providerId,
          numeroPóliza: input.numeroPóliza,
          titular: input.titular ?? null,
          coberturaPct: input.coberturaPct,
          fechaVigencia: input.fechaVigencia ? new Date(input.fechaVigencia) : null,
          notas: input.notas ?? null,
        },
        include: { provider: true },
      })
    }),

  updatePatientInsurance: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        numeroPóliza: z.string().optional(),
        titular: z.string().optional(),
        coberturaPct: z.number().int().min(0).max(100).optional(),
        fechaVigencia: z.string().nullable().optional(),
        activa: z.boolean().optional(),
        notas: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, fechaVigencia, ...rest } = input
      return (ctx.db as any).patientInsurance.update({
        where: { id },
        data: {
          ...rest,
          ...(fechaVigencia !== undefined
            ? { fechaVigencia: fechaVigencia ? new Date(fechaVigencia) : null }
            : {}),
        },
        include: { provider: true },
      })
    }),
})

import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, doctorProcedure, protectedProcedure } from "../trpc"
import { sendInvoiceEmail } from "../../lib/email"

export const invoiceRouter = router({
  create: doctorProcedure
    .input(
      z.object({
        patientRegistrationId: z.string(),
        encounterId: z.string().optional(),
        descripcion: z.string().optional(),
        montoUsd: z.number().positive(),
        metodoPago: z
          .enum(["EFECTIVO_USD", "EFECTIVO_BS", "TRANSFERENCIA_BS", "ZELLE", "BINANCE_USDT", "PAGOMOVIL"])
          .default("EFECTIVO_USD"),
        insuranceProviderId: z.string().optional(),
        montoSeguro: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reg = await ctx.db.patientRegistration.findFirst({
        where: { id: input.patientRegistrationId, workspaceId: ctx.session.workspaceId },
      })
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" })

      const workspace = await ctx.db.workspace.findUnique({
        where: { id: ctx.session.workspaceId },
      })
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND" })

      const tasa = workspace.tasaBcvActual ? Number(workspace.tasaBcvActual) : 0
      const montoUsd = input.montoUsd
      const montoBs = tasa > 0 ? montoUsd * tasa : 0

      // Sequential invoice number
      const count = await ctx.db.invoice.count({ where: { workspaceId: ctx.session.workspaceId } })
      const numero = `F-${String(count + 1).padStart(6, "0")}`

      return ctx.db.invoice.create({
        data: {
          workspaceId: ctx.session.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
          encounterId: input.encounterId,
          numero,
          descripcion: input.descripcion,
          montoUsd: montoUsd,
          tasaBcv: tasa,
          montoBs: montoBs,
          metodoPago: input.metodoPago,
          insuranceProviderId: input.insuranceProviderId ?? null,
          montoSeguro: input.montoSeguro != null ? input.montoSeguro : null,
        },
        include: { patientRegistration: { include: { patient: true } } },
      })
    }),

  markPaid: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.db.invoice.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.invoice.update({
        where: { id: input.id },
        data: { status: "PAID", fechaPago: new Date() },
      })
    }),

  cancel: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.db.invoice.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" })
      if (inv.status === "PAID") throw new TRPCError({ code: "FORBIDDEN", message: "No se puede cancelar una factura pagada." })
      return ctx.db.invoice.update({ where: { id: input.id }, data: { status: "CANCELLED" } })
    }),

  addPago: doctorProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        monto: z.number().positive(),
        metodoPago: z.enum(["EFECTIVO_USD", "EFECTIVO_BS", "TRANSFERENCIA_BS", "ZELLE", "BINANCE_USDT", "PAGOMOVIL"]),
        notas: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.db.invoice.findFirst({
        where: { id: input.invoiceId, workspaceId: ctx.session.workspaceId },
        include: { pagos: true },
      })
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" })
      if (inv.status !== "PENDING") throw new TRPCError({ code: "FORBIDDEN", message: "Solo se pueden abonar facturas pendientes." })

      const pago = await ctx.db.pago.create({
        data: {
          invoiceId: input.invoiceId,
          monto: input.monto,
          metodoPago: input.metodoPago,
          notas: input.notas,
        },
      })

      const totalAbonado = inv.pagos.reduce((s, p) => s + Number(p.monto), 0) + input.monto
      if (totalAbonado >= Number(inv.montoUsd)) {
        await ctx.db.invoice.update({
          where: { id: input.invoiceId },
          data: { status: "PAID", fechaPago: new Date() },
        })
      }

      return pago
    }),

  deletePago: doctorProcedure
    .input(z.object({ pagoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pago = await ctx.db.pago.findFirst({
        where: { id: input.pagoId },
        include: { invoice: { select: { workspaceId: true } } },
      })
      if (!pago || pago.invoice.workspaceId !== ctx.session.workspaceId)
        throw new TRPCError({ code: "NOT_FOUND" })
      return ctx.db.pago.delete({ where: { id: input.pagoId } })
    }),

  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "PAID", "CANCELLED"]).optional(),
        take: z.number().int().min(1).max(100).default(50),
        skip: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.invoice.findMany({
        where: {
          workspaceId: ctx.session.workspaceId,
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          patientRegistration: { include: { patient: { select: { nombre: true, apellido: true, email: true } } } },
          pagos: { orderBy: { createdAt: "asc" } },
          items: { orderBy: { createdAt: "asc" } },
          insuranceProvider: { select: { id: true, nombre: true, codigo: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input.take,
        skip: input.skip,
      })
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const inv = await ctx.db.invoice.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
        include: { patientRegistration: { include: { patient: true } } },
      })
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" })
      return inv
    }),

  emailInvoice: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.db.invoice.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
        include: { patientRegistration: { include: { patient: true } } },
      })
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" })
      const patient = inv.patientRegistration.patient
      if (!patient.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El paciente no tiene email registrado.",
        })
      }
      await sendInvoiceEmail({
        to: patient.email,
        patientName: `${patient.nombre} ${patient.apellido}`,
        numero: inv.numero,
        montoUsd: Number(inv.montoUsd).toFixed(2),
        fecha: new Date(inv.createdAt).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' }),
        pdfUrl: inv.pdfUrl ?? undefined,
      })
      return { sent: true }
    }),

  addLineItem: doctorProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        descripcion: z.string().min(1).max(200),
        cantidad: z.number().int().min(1).default(1),
        precioUnitarioUsd: z.number().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.db.invoice.findFirst({
        where: { id: input.invoiceId, workspaceId: ctx.session.workspaceId },
        select: { id: true, status: true, tasaBcv: true },
      })
      if (!inv) throw new TRPCError({ code: "NOT_FOUND" })
      if (inv.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "Solo facturas pendientes." })

      await ctx.db.invoiceItem.create({
        data: {
          invoiceId: input.invoiceId,
          descripcion: input.descripcion,
          cantidad: input.cantidad,
          precioUnitarioUsd: input.precioUnitarioUsd,
        },
      })

      const items = await ctx.db.invoiceItem.findMany({
        where: { invoiceId: input.invoiceId, invoice: { workspaceId: ctx.session.workspaceId } },
      })
      const newMontoUsd = items.reduce((s, i) => s + Number(i.precioUnitarioUsd) * i.cantidad, 0)
      const newMontoBs = newMontoUsd * Number(inv.tasaBcv)
      return ctx.db.invoice.update({
        where: { id: input.invoiceId },
        data: { montoUsd: newMontoUsd, montoBs: newMontoBs },
        include: { items: { orderBy: { createdAt: "asc" } }, pagos: { orderBy: { createdAt: "asc" } } },
      })
    }),

  removeLineItem: doctorProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.invoiceItem.findFirst({
        where: { id: input.itemId },
        include: { invoice: { select: { id: true, workspaceId: true, status: true, tasaBcv: true } } },
      })
      if (!item || item.invoice.workspaceId !== ctx.session.workspaceId) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }
      if (item.invoice.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST" })

      await ctx.db.invoiceItem.delete({ where: { id: input.itemId } })

      const remaining = await ctx.db.invoiceItem.findMany({
        where: { invoiceId: item.invoice.id, invoice: { workspaceId: ctx.session.workspaceId } },
      })
      const newMontoUsd = remaining.reduce((s, i) => s + Number(i.precioUnitarioUsd) * i.cantidad, 0)
      const newMontoBs = newMontoUsd * Number(item.invoice.tasaBcv)
      return ctx.db.invoice.update({
        where: { id: item.invoice.id },
        data: { montoUsd: Math.max(newMontoUsd, 0), montoBs: Math.max(newMontoBs, 0) },
        include: { items: { orderBy: { createdAt: "asc" } }, pagos: { orderBy: { createdAt: "asc" } } },
      })
    }),

})

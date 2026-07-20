import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, protectedProcedure } from "../trpc"

// Helper to check admin access
const requireAdmin = (ctx: any) => {
  if (ctx.session?.email !== "cpierluissis@gmail.com") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Only super admins can access marketing messages" })
  }
}

export const adminMensajesRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      requireAdmin(ctx)
      
      const mensajes = await ctx.db.marketingMessage.findMany({
        orderBy: { createdAt: "asc" },
      })
      
      return { mensajes }
    }),

  send: protectedProcedure
    .input(z.object({
      telefono: z.string(),
      texto: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx)

      const { sendWhatsAppText } = await import("@/lib/whatsapp")
      
      const wa = await sendWhatsAppText(input.telefono, input.texto)
      if (!wa.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error enviando WhatsApp: " + wa.error })
      }

      return ctx.db.marketingMessage.create({
        data: {
          telefono: input.telefono,
          texto: input.texto,
          direccion: "OUTBOUND",
          leido: true,
        },
      })
    }),

  markAsRead: protectedProcedure
    .input(z.object({ telefono: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx)
      
      await ctx.db.marketingMessage.updateMany({
        where: { telefono: input.telefono, leido: false, direccion: "INBOUND" },
        data: { leido: true },
      })
      return { success: true }
    }),
})

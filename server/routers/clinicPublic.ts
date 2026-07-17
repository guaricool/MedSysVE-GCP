import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, publicProcedure, doctorProcedure } from "../trpc"

export const clinicPublicRouter = router({
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const clinic = await ctx.db.clinic.findUnique({
        where: { slug: input.slug, activa: true },
        include: {
          affiliations: {
            where: { activo: true },
            include: {
              doctor: {
                select: {
                  nombre: true,
                  apellido: true,
                  especialidadPrincipal: true,
                  subEspecialidades: true,
                  fotoUrl: true,
                  bio: true,
                  idiomas: true,
                },
              },
            },
          },
        },
      })
      if (!clinic) throw new TRPCError({ code: "NOT_FOUND" })
      return clinic
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.clinic.findMany({
        where: {
          activa: true,
          OR: [
            { nombre: { contains: input.query, mode: "insensitive" } },
            { descripcion: { contains: input.query, mode: "insensitive" } },
            { direccion: { contains: input.query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          slug: true,
          nombre: true,
          descripcion: true,
          direccion: true,
          telefono: true,
          logoUrl: true,
          servicios: true,
        },
        take: 20,
      })
    }),

  getPosts: publicProcedure
    .input(z.object({ clinicId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.clinicPost.findMany({
        where: { clinicId: input.clinicId, activo: true },
        orderBy: { publicadoAt: "desc" },
        take: 20,
      })
    }),

  createPost: doctorProcedure
    .input(
      z.object({
        titulo: z.string().min(3).max(200),
        contenido: z.string().min(10),
        imagenUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ws = await ctx.db.workspace.findUnique({
        where: { id: ctx.session.workspaceId },
        include: { clinic: { select: { id: true } } },
      })
      if (!ws?.clinic) throw new TRPCError({ code: "NOT_FOUND", message: "No tienes una clínica asociada" })
      return ctx.db.clinicPost.create({
        data: {
          clinicId: ws.clinic.id,
          titulo: input.titulo,
          contenido: input.contenido,
          imagenUrl: input.imagenUrl,
        },
      })
    }),

  deletePost: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ws = await ctx.db.workspace.findUnique({
        where: { id: ctx.session.workspaceId },
        include: { clinic: { select: { id: true } } },
      })
      if (!ws?.clinic) throw new TRPCError({ code: "NOT_FOUND" })
      await ctx.db.clinicPost.updateMany({
        where: { id: input.id, clinicId: ws.clinic.id },
        data: { activo: false },
      })
      return { success: true }
    }),
})

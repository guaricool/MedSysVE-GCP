import { z } from 'zod';
import { router, doctorProcedure } from '../trpc';

// Strip diacritics for accent-insensitive matching. "Paracetamol"
// should match "Acetaminofén" because the patient pool in Venezuela uses
// both spellings interchangeably.
const foldAccents = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export const medicationRouter = router({
  search: doctorProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ ctx, input }) => {
      // Direct PostgreSQL search
      const q = input.query.trim();
      const qFold = foldAccents(q);
      const dbResults = await ctx.db.medication.findMany({
        where: {
          activo: true,
          OR: [
            { nombreGenerico: { contains: q, mode: 'insensitive' } },
            { nombresComerciales: { has: q } },
            { nombreGenerico: { contains: qFold, mode: 'insensitive' } },
          ],
          AND: [
            {
              OR: [
                { workspaceId: null },
                { workspaceId: ctx.session.workspaceId },
              ],
            },
          ],
        },
        take: 100,
      });

      const matched = dbResults.filter((m) => {
        if (foldAccents(m.nombreGenerico).includes(qFold)) return true;
        return m.nombresComerciales.some((c) => foldAccents(c).includes(qFold));
      });

      return matched.slice(0, 15).map((m) => ({
        id: m.id,
        nombreGenerico: m.nombreGenerico,
        nombresComerciales: m.nombresComerciales,
        concentraciones: m.concentraciones,
        categoria: m.categoria,
      }));
    }),

  get: doctorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.medication.findUnique({ where: { id: input.id } });
    }),

  addCustom: doctorProcedure
    .input(
      z.object({
        nombreGenerico: z.string().min(2),
        nombresComerciales: z.array(z.string()).default([]),
        concentraciones: z.array(z.string()).default([]),
        formaFarmaceutica: z.string(),
        viaAdministracion: z.string(),
        categoria: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const med = await ctx.db.medication.create({
        data: {
          ...input,
          isCustom: true,
          activo: true,
          workspaceId: ctx.session.workspaceId,
        },
      });
      return med;
    }),
});

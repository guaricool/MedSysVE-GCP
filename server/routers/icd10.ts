import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { icd10VE } from "../../prisma/data/icd10-ve"

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

export const icd10Router = router({
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(({ input }) => {
      const q = normalize(input.query.trim())
      return icd10VE
        .filter((c) => normalize(c.codigo).includes(q) || normalize(c.descripcion).includes(q))
        .slice(0, 20)
    }),
})

import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const ADMIN_EMAIL = "cpierluissis@gmail.com";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.email !== ADMIN_EMAIL) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const marketingRouter = router({
  listPosts: adminProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.marketingPost.findMany({
      orderBy: { publishedAt: "desc" },
    });
    return posts;
  }),

  republishPost: adminProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.marketingPost.findUnique({
        where: { id: input.postId }
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      // Mark it as PUBLISHED again and update the timestamp
      const updated = await ctx.db.marketingPost.update({
        where: { id: input.postId },
        data: {
          publishedAt: new Date()
        }
      });

      return { success: true, updated };
    }),
});

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

async function getSecret(secretName: string) {
  try {
    const tokenRes = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", {
      headers: { "Metadata-Flavor": "Google" }
    });
    if (!tokenRes.ok) return process.env[secretName];
    const { access_token } = await tokenRes.json();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || "medsysve-gcp";
    const secretRes = await fetch(`https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets/${secretName}/versions/latest:access`, {
      headers: { "Authorization": `Bearer ${access_token}` }
    });
    const secretData = await secretRes.json();
    return Buffer.from(secretData.payload.data, 'base64').toString('utf8').trim();
  } catch (e) {
    return process.env[secretName];
  }
}

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

      // Fetch secrets
      const igToken = await getSecret("IG_ACCESS_TOKEN");
      const igAccountId = await getSecret("IG_ACCOUNT_ID");

      if (!igToken || !igAccountId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Missing IG credentials" });
      }

      const fullText = `${post.caption}\n\n${post.hashtags}`;
      
      // 1. Create a media container
      const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: post.imageUrl,
          caption: fullText,
          access_token: igToken
        })
      });
      const containerData = await containerRes.json();
      
      if (!containerData.id) {
        console.error("IG Container Error:", containerData);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create media container" });
      }

      // Wait 5 seconds
      await new Promise(r => setTimeout(r, 5000));

      // 2. Publish
      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: igToken
        })
      });
      const publishData = await publishRes.json();
      
      if (!publishData.id) {
        console.error("IG Publish Error:", publishData);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to publish media" });
      }

      // Mark it as PUBLISHED again and update the timestamp
      const updated = await ctx.db.marketingPost.update({
        where: { id: input.postId },
        data: {
          publishedAt: new Date(),
          igMediaId: publishData.id
        }
      });

      return { success: true, updated };
    }),
});

import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const ADMIN_EMAIL = "cpierluissis@gmail.com";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const isAdmin = (ctx.session as any)?.isAdmin || ctx.session?.email === ADMIN_EMAIL;
  if (!isAdmin) {
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
    if (!secretData || !secretData.payload) {
      console.error("No payload in secretData", secretData);
      return process.env[secretName];
    }
    return atob(secretData.payload.data).trim();
  } catch (e) {
    console.error("getSecret Error:", e);
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

  createPost: adminProcedure
    .input(z.object({
      imageUrl: z.string().min(1),
      caption: z.string().min(1),
      hashtags: z.string(),
      style: z.enum(["hyperrealistic", "cartoon", "screenshot", "marketing"]),
      status: z.enum(["PUBLISHED", "PENDING_APPROVAL", "DRAFT", "FAILED"]).default("PENDING_APPROVAL"),
      publishNow: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      let igMediaId: string | null = null;
      let postStatus = input.publishNow ? "PUBLISHED" : input.status;

      if (input.publishNow) {
        const igToken = await getSecret("IG_ACCESS_TOKEN");
        const igAccountId = await getSecret("IG_ACCOUNT_ID");
        if (igToken && igAccountId) {
          try {
            const fullText = `${input.caption}\n\n${input.hashtags}`;
            const fullImageUrl = input.imageUrl.startsWith("http")
              ? input.imageUrl
              : `https://www.medsysve.com${input.imageUrl.startsWith("/") ? "" : "/"}${input.imageUrl}`;

            const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                image_url: fullImageUrl,
                caption: fullText,
                access_token: igToken
              })
            });
            const containerData = await containerRes.json();
            if (containerData.id) {
              await new Promise(r => setTimeout(r, 4000));
              const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  creation_id: containerData.id,
                  access_token: igToken
                })
              });
              const publishData = await publishRes.json();
              if (publishData.id) {
                igMediaId = publishData.id;
                postStatus = "PUBLISHED";
              }
            }
          } catch (e) {
            console.error("Auto-publish failed:", e);
          }
        }
      }

      return ctx.db.marketingPost.create({
        data: {
          imageUrl: input.imageUrl,
          caption: input.caption,
          hashtags: input.hashtags,
          style: input.style,
          status: postStatus,
          igMediaId: igMediaId,
        }
      });
    }),

  updatePost: adminProcedure
    .input(z.object({
      postId: z.string(),
      caption: z.string().min(1),
      hashtags: z.string(),
      style: z.string(),
      imageUrl: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.marketingPost.update({
        where: { id: input.postId },
        data: {
          caption: input.caption,
          hashtags: input.hashtags,
          style: input.style,
          imageUrl: input.imageUrl,
        }
      });
    }),

  deletePost: adminProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.marketingPost.delete({
        where: { id: input.postId }
      });
    }),

  republishPost: adminProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.marketingPost.findUnique({
        where: { id: input.postId }
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post no encontrado" });
      }

      // Fetch secrets
      const igToken = await getSecret("IG_ACCESS_TOKEN");
      const igAccountId = await getSecret("IG_ACCOUNT_ID");

      if (!igToken || !igAccountId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Credenciales de Instagram no configuradas o incompletas en Secret Manager (IG_ACCESS_TOKEN / IG_ACCOUNT_ID)."
        });
      }

      const fullText = `${post.caption}\n\n${post.hashtags}`;
      const fullImageUrl = post.imageUrl.startsWith("http")
        ? post.imageUrl
        : `https://www.medsysve.com${post.imageUrl.startsWith("/") ? "" : "/"}${post.imageUrl}`;

      // 1. Create a media container
      const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: fullImageUrl,
          caption: fullText,
          access_token: igToken
        })
      });
      const containerData = await containerRes.json();

      if (!containerData.id) {
        console.error("IG Container Error:", containerData);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Error de la API de Instagram: ${containerData.error?.message || "No se pudo crear el contenedor multimedia en Facebook."}`
        });
      }

      // Wait 4 seconds
      await new Promise(r => setTimeout(r, 4000));

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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Error al publicar en Instagram: ${publishData.error?.message || "Error al solicitar publicación."}`
        });
      }

      // Mark it as PUBLISHED again and update the timestamp
      const updated = await ctx.db.marketingPost.update({
        where: { id: input.postId },
        data: {
          publishedAt: new Date(),
          status: "PUBLISHED",
          igMediaId: publishData.id
        }
      });

      return { success: true, updated };
    }),
});

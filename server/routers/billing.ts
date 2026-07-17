import { z } from "zod";
import { router, doctorProcedure } from "../trpc";
import { stripe } from "@/lib/stripe";
import { TRPCError } from "@trpc/server";

export const billingRouter = router({
  /**
   * Create a Stripe Checkout Session for a subscription.
   *
   * Authz: doctorProcedure — only DOCTOR role can create checkout sessions.
   * (Audit S6: previously used protectedProcedure, which let any authenticated
   * user — including PATIENT, SECRETARY, NURSE, ASSISTANT — call this.
   * The inline check was also broken for the clinic branch — it didn't even
   * throw UNAUTHORIZED, just had a comment saying "we'll allow it for now".)
   *
   * `entityType === "doctor"` is the only wired path today (subscription-card.tsx
   * in components/workspace/). `entityType === "clinic"` is NOT wired from the
   * UI yet — when CLINIC_ADMIN billing is added, it should be a separate
   * procedure on clinicAdminProcedure with proper clinicId ownership check,
   * not a branch on this one.
   */
  createCheckoutSession: doctorProcedure
    .input(
      z.object({
        priceId: z.string(),
        entityType: z.enum(["doctor", "clinic"]),
        entityId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // entityId must match the calling doctor's id — prevents one doctor
      // from opening a checkout session for another doctor's subscription.
      if (input.entityId !== ctx.session.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot create a checkout session for a different entity.",
        })
      }

      if (input.entityType === "clinic") {
        // Clinic-admin checkout is not implemented yet. When wired, this
        // should be a separate procedure on clinicAdminProcedure that
        // verifies `ctx.clinicId === input.entityId`.
        throw new TRPCError({
          code: "NOT_IMPLEMENTED",
          message:
            "Clinic billing checkout is not wired yet. See server/routers/clinicAdmin.ts for the planned path.",
        })
      }

      // Derive public base URL from NEXTAUTH_URL (already set in Coolify).
      // Force `www.` prefix to match Traefik's apex→www redirect — otherwise
      // the user lands on medsysve.com after checkout and the redirect strips
      // the `__Secure-authjs.session-token` cookie (cookie drops on cross-host
      // redirect). Result: user looks "logged out" right after paying.
      const baseUrl = (process.env.NEXTAUTH_URL ?? "https://www.medsysve.com").replace(
        /^https?:\/\/(?!www\.)/,
        "https://www."
      );

      try {
        const stripeSession = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: input.priceId,
              quantity: 1,
            },
          ],
          // /workspace is the doctor's settings page where the SubscriptionCard
          // lives. It exists in the app router; /dashboard does NOT.
          // {CHECKOUT_SESSION_ID} placeholder is replaced by Stripe with the
          // real session id; client page uses it to trigger a status refresh.
          success_url: `${baseUrl}/workspace?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/workspace?checkout=cancel`,
          client_reference_id: input.entityId,
          metadata: {
            entityType: input.entityType,
          },
        });

        if (!stripeSession.url) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create Stripe session" })
        }

        return { url: stripeSession.url };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),
});
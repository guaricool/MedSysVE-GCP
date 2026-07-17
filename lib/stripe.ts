import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production") {
  console.warn("STRIPE_SECRET_KEY is missing in environment variables.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  // @ts-ignore
  apiVersion: "2023-10-16",
  appInfo: {
    name: "MedSysVE",
    url: "https://medsysve.com",
  },
});

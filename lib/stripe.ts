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

export const STRIPE_PRICES = {
  INDIVIDUAL_MONTHLY: process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY || "price_1Tr6EzGxA3iXs4UR5QnXZb9K",
  INDIVIDUAL_QUARTERLY: process.env.STRIPE_PRICE_INDIVIDUAL_QUARTERLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_QUARTERLY || "price_1Tr6FvGxA3iXs4URQc3rL98T",
  EXTRA_WORKSPACE_MONTHLY: process.env.STRIPE_PRICE_EXTRA_WORKSPACE_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_EXTRA_WORKSPACE_MONTHLY || "price_1Tr6HOGxA3iXs4URoqbFtHC5",
  VOICE_ADDON_MONTHLY: process.env.STRIPE_PRICE_VOICE_ADDON_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_VOICE_ADDON_MONTHLY || "price_1Tr6I5GxA3iXs4UR3U33pZKz",
} as const

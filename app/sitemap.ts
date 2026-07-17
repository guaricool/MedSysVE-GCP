import type { MetadataRoute } from "next"

/**
 * Dynamic sitemap for MedSysVE.
 *
 * Lists the public routes that should be indexed by search engines.
 * Routes that require authentication (/(dashboard), /portal, /clinica/admin)
 * are deliberately excluded — we don't want patient records or PHI to leak
 * via search engine caches.
 *
 * Last updated: 2026-07-06 (SEO F3).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.medsysve.com"
  const now = new Date()

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/forgot-password`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/legal/terminos`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/legal/privacidad`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/legal/cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/legal/lopdp-consentimiento`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ]
}
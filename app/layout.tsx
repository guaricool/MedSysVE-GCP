import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { TRPCProvider } from "@/components/providers/trpc-provider"

const inter = Inter({ subsets: ["latin"] })

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.medsysve.com"
const SITE_NAME = "MedSysVE"
const SITE_DESCRIPTION =
  "Historia Clínica Electrónica multi-tenant para médicos y clínicas en Venezuela. Recetas digitales, referidos entre doctores, asistencia IA, facturación dual USD/Bs, portal para pacientes. Cumple LOPDP."
const SITE_KEYWORDS = [
  "historia clínica electrónica",
  "HCE Venezuela",
  "software médico",
  "recetas digitales",
  "sistema de gestión médica",
  "EMR Venezuela",
  "LOPDP",
  "telemedicina",
  "Yoguitech",
]
const TWITTER_HANDLE = "@medsysve"

export const viewport: Viewport = {
  themeColor: "#FFD100",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Historia Clínica Electrónica para Venezuela`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: "Yoguitech LLC", url: "https://www.medsysve.com" }],
  creator: "Yoguitech LLC",
  publisher: "Yoguitech LLC",
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Always emit an absolute canonical URL so search engines don't index
  // apex/www duplicates from the Traefik apex→www redirect.
  alternates: {
    canonical: "/",
  },
  // Open Graph — used by WhatsApp, LinkedIn, Facebook, Discord previews.
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — HCE para Venezuela`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MedSysVE — Historia Clínica Electrónica para Venezuela",
        type: "image/png",
      },
    ],
    countryName: "Venezuela",
  },
  // Twitter / X card.
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: `${SITE_NAME} — HCE para Venezuela`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  // App-style metadata for iOS / Android home screen pinning.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  // Icons are served automatically from the `app/icon.png` and
  // `app/apple-icon.png` file conventions — do NOT redeclare them
  // here, otherwise Next.js adds extra <link> tags pointing to
  // non-existent files (e.g. /favicon.ico) and the browser 404s on
  // every page load.
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
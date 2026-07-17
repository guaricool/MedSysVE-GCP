import { LegalPage } from "@/lib/legal/legal-page"

export const metadata = {
  title: "Política de Cookies — MedSysVE",
  description: "Política de Cookies de MedSysVE conforme a la LOPDP.",
}

export default function CookiesPage() {
  return <LegalPage slug="cookies" />
}
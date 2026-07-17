import { LegalPage } from "@/lib/legal/legal-page"

export const metadata = {
  title: "Consentimiento Informado (LOPDP) — MedSysVE",
  description: "Texto del consentimiento expreso exigido por la LOPDP para usuarios de MedSysVE.",
}

export default function LopdpConsentimientoPage() {
  return <LegalPage slug="lopdp-consentimiento" />
}
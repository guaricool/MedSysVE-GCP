import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") || "Historia Clínica Electrónica";
  const subtitle = searchParams.get("subtitle") || "Plataforma Médica Integral en Venezuela";
  const specialty = searchParams.get("specialty") || "Medicina General";

  // Official MedSysVE Brand Colors:
  // - Background: Deep Dark Navy Slate (#0b132b -> #0f172a)
  // - Primary Accent: Amber Gold (#f59e0b, #d97706, #fbbf24)
  // - Secondary Accent: Electric Cyan/Blue (#38bdf8, #0ea5e9)
  // - Text: White (#ffffff) & Gold (#fbbf24) & Slate (#94a3b8)

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="medsysBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b132b" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.98" />
    </linearGradient>

    <pattern id="hexGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(245, 158, 11, 0.05)" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#medsysBg)" />
  <rect width="1080" height="1080" fill="url(#hexGrid)" />

  <!-- Ambient Glow Effects -->
  <circle cx="200" cy="180" r="350" fill="#f59e0b" fill-opacity="0.14" filter="blur(90px)" />
  <circle cx="880" cy="880" r="400" fill="#38bdf8" fill-opacity="0.12" filter="blur(110px)" />

  <!-- Top Header Bar -->
  <g transform="translate(80, 70)">
    <rect x="0" y="0" width="920" height="74" rx="18" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1.5" />
    <text x="35" y="46" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="24" fill="#fbbf24" letter-spacing="3">MEDSYSVE®</text>
    <text x="215" y="46" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="17" fill="#94a3b8" letter-spacing="2">| HISTORIA CLÍNICA ELECTRÓNICA VENEZUELA</text>
    <rect x="830" y="20" width="60" height="34" rx="8" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-opacity="0.4" />
    <text x="844" y="43" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="14" fill="#fbbf24">🇻🇪 VE</text>
  </g>

  <!-- Central Card Frame -->
  <g transform="translate(80, 180)">
    <rect x="0" y="0" width="920" height="720" rx="32" fill="url(#cardBg)" stroke="rgba(245, 158, 11, 0.25)" stroke-width="2" />
    
    <!-- Top Gold Accent Line -->
    <rect x="0" y="0" width="920" height="10" rx="5" fill="url(#goldGrad)" />

    <!-- Specialty Badge -->
    <g transform="translate(60, 55)">
      <rect x="0" y="0" width="520" height="52" rx="14" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" stroke-opacity="0.5" stroke-width="1.5" />
      <text x="22" y="34" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="18" fill="#fbbf24" letter-spacing="1.5">🩺 ${specialty.toUpperCase()}</text>
    </g>

    <!-- Main Title -->
    <foreignObject x="60" y="135" width="800" height="260">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, -apple-system, sans-serif; color: #ffffff; font-size: 52px; font-weight: 900; line-height: 1.15; letter-spacing: -1px;">
        ${title}
      </div>
    </foreignObject>

    <!-- Subtitle / Description -->
    <foreignObject x="60" y="420" width="800" height="180">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, -apple-system, sans-serif; color: #cbd5e1; font-size: 26px; font-weight: 500; line-height: 1.5;">
        ${subtitle}
      </div>
    </foreignObject>

    <!-- Feature Pillars -->
    <g transform="translate(60, 610)">
      <rect x="0" y="0" width="245" height="54" rx="12" fill="rgba(245, 158, 11, 0.1)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1.5" />
      <text x="20" y="34" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" fill="#fbbf24">✓ Tasa Oficial BCV</text>

      <rect x="265" y="0" width="245" height="54" rx="12" fill="rgba(56, 189, 248, 0.1)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1.5" />
      <text x="285" y="34" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" fill="#38bdf8">✓ Firma &amp; QR Legal</text>

      <rect x="530" y="0" width="245" height="54" rx="12" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.3)" stroke-width="1.5" />
      <text x="550" y="34" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" fill="#34d399">✓ SACS MPPS Valid</text>
    </g>
  </g>

  <!-- Bottom Footer Bar -->
  <g transform="translate(80, 935)">
    <rect x="0" y="0" width="920" height="64" rx="16" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1.5" />
    <text x="35" y="39" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#38bdf8" letter-spacing="1">🌐 www.medsysve.com</text>
    <text x="560" y="39" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="16" fill="#94a3b8">Cifrado HIPAA / LOPDP • Nube GCP</text>
  </g>
</svg>
`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

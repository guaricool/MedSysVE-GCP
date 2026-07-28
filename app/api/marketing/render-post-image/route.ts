import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") || "Historia Clínica Electrónica";
  const subtitle = searchParams.get("subtitle") || "Plataforma Médica Integral en Venezuela";
  const specialty = searchParams.get("specialty") || "Medicina General";
  const theme = searchParams.get("theme") || "emerald";

  // Palette map according to style/theme
  const themes: Record<string, { bg1: string; bg2: string; accent: string; badgeBg: string; textAccent: string }> = {
    emerald: {
      bg1: "#064e3b",
      bg2: "#022c22",
      accent: "#10b981",
      badgeBg: "rgba(16, 185, 129, 0.2)",
      textAccent: "#34d399",
    },
    purple: {
      bg1: "#4c1d95",
      bg2: "#1e1b4b",
      accent: "#a855f7",
      badgeBg: "rgba(168, 85, 247, 0.2)",
      textAccent: "#c084fc",
    },
    amber: {
      bg1: "#78350f",
      bg2: "#451a03",
      accent: "#f59e0b",
      badgeBg: "rgba(245, 158, 11, 0.2)",
      textAccent: "#fbbf24",
    },
    cyan: {
      bg1: "#164e63",
      bg2: "#083344",
      accent: "#06b6d4",
      badgeBg: "rgba(6, 182, 212, 0.2)",
      textAccent: "#22d3ee",
    },
    indigo: {
      bg1: "#312e81",
      bg2: "#1e1b4b",
      accent: "#6366f1",
      badgeBg: "rgba(99, 102, 241, 0.2)",
      textAccent: "#818cf8",
    },
  };

  const colors = themes[theme] || themes.emerald;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.bg1}" />
      <stop offset="100%" stop-color="${colors.bg2}" />
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0.95" />
    </linearGradient>

    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${colors.accent}" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>

    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bgGrad)" />
  <rect width="1080" height="1080" fill="url(#grid)" />

  <!-- Ambient Glow Circles -->
  <circle cx="200" cy="200" r="300" fill="${colors.accent}" fill-opacity="0.15" filter="blur(80px)" />
  <circle cx="880" cy="880" r="350" fill="#38bdf8" fill-opacity="0.12" filter="blur(100px)" />

  <!-- Top Header Bar -->
  <g transform="translate(80, 80)">
    <rect x="0" y="0" width="920" height="70" rx="16" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
    <text x="30" y="44" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" fill="${colors.textAccent}" letter-spacing="4">MEDSYSVE®</text>
    <text x="210" y="44" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="18" fill="#94a3b8" letter-spacing="2">| HISTORIA CLÍNICA ELECTRÓNICA VENEZUELA</text>
    <rect x="830" y="18" width="60" height="34" rx="8" fill="rgba(16, 185, 129, 0.2)" />
    <text x="844" y="41" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="14" fill="#34d399">🇻🇪 VE</text>
  </g>

  <!-- Central Card Frame -->
  <g transform="translate(80, 190)">
    <rect x="0" y="0" width="920" height="720" rx="28" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2" />
    
    <!-- Top Accent Line -->
    <rect x="0" y="0" width="920" height="8" rx="4" fill="url(#accentGrad)" />

    <!-- Specialty Badge -->
    <g transform="translate(60, 60)">
      <rect x="0" y="0" width="480" height="50" rx="12" fill="${colors.badgeBg}" stroke="${colors.accent}" stroke-opacity="0.4" stroke-width="1.5" />
      <text x="20" y="32" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="18" fill="${colors.textAccent}" letter-spacing="1.5">🩺 ${specialty.toUpperCase()}</text>
    </g>

    <!-- Main Title -->
    <foreignObject x="60" y="140" width="800" height="260">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, -apple-system, sans-serif; color: #f8fafc; font-size: 52px; font-weight: 900; line-height: 1.15; letter-spacing: -1px;">
        ${title}
      </div>
    </foreignObject>

    <!-- Subtitle / Description -->
    <foreignObject x="60" y="420" width="800" height="180">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, -apple-system, sans-serif; color: #94a3b8; font-size: 26px; font-weight: 500; line-height: 1.5;">
        ${subtitle}
      </div>
    </foreignObject>

    <!-- Feature Highlights -->
    <g transform="translate(60, 610)">
      <rect x="0" y="0" width="240" height="50" rx="10" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
      <text x="20" y="32" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="16" fill="#e2e8f0">✓ BCV Automático</text>

      <rect x="260" y="0" width="240" height="50" rx="10" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
      <text x="280" y="32" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="16" fill="#e2e8f0">✓ Firma &amp; QR Legal</text>

      <rect x="520" y="0" width="240" height="50" rx="10" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
      <text x="540" y="32" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="16" fill="#e2e8f0">✓ SACS MPPS Valid</text>
    </g>
  </g>

  <!-- Bottom Footer Bar -->
  <g transform="translate(80, 940)">
    <rect x="0" y="0" width="920" height="60" rx="14" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
    <text x="30" y="37" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="18" fill="#38bdf8" letter-spacing="1">🌐 www.medsysve.com</text>
    <text x="580" y="37" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="16" fill="#64748b">Cifrado HIPAA / LOPDP • Nube GCP</text>
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

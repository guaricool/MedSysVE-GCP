import sharp from "sharp";
import { readFile } from "fs/promises";
import { join } from "path";

let cachedLogoBuffer: Buffer | null = null;

async function getLogoBuffer(): Promise<Buffer> {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  const logoPath = join(process.cwd(), "public", "logo-medsysve.png");
  cachedLogoBuffer = await readFile(logoPath);
  return cachedLogoBuffer;
}

function escapeSvgText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function overlayMedSysVEBranding(
  baseImageBuffer: Buffer,
  options: {
    style: "hyperrealistic" | "cartoon" | "screenshot" | "marketing";
    specialty: string;
    topic: string;
  }
): Promise<Buffer> {
  const { style, specialty, topic } = options;

  // Resize base image to exact 1080x1080px
  const resizedBase = await sharp(baseImageBuffer)
    .resize(1080, 1080, { fit: "cover", position: "center" })
    .toBuffer();

  const isScreenshotStyle = style === "screenshot";
  const isCartoonStyle = style === "cartoon";

  const badgeText = isScreenshotStyle
    ? "🖥️ CAPTURA DE PANTALLA EN VIVO • MEDSYSVE®"
    : isCartoonStyle
    ? `🎨 ILUSTRACIÓN PEDIÁTRICA • ${specialty.toUpperCase()}`
    : `🩺 ${specialty.toUpperCase()} • MEDSYSVE®`;

  const fontStack = "'DejaVu Sans', 'Noto Sans', 'Liberation Sans', Arial, Helvetica, sans-serif";

  // Build SVG overlay layer
  const svgOverlay = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="topGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b132b" stop-opacity="0.92" />
      <stop offset="60%" stop-color="#0f172a" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="bottomGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b132b" stop-opacity="0" />
      <stop offset="40%" stop-color="#0b132b" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#0b132b" stop-opacity="0.96" />
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>

  <!-- Ambient Shading top and bottom for readability -->
  <rect x="0" y="0" width="1080" height="180" fill="url(#topGlow)" />
  <rect x="0" y="900" width="1080" height="180" fill="url(#bottomGlow)" />

  <!-- Top Header Bar Container -->
  <g transform="translate(40, 35)">
    <rect x="0" y="0" width="1000" height="74" rx="16" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(245, 158, 11, 0.4)" stroke-width="1.5" />
    <text x="240" y="46" font-family="${fontStack}" font-weight="700" font-size="16" fill="#94a3b8" letter-spacing="1">| HISTORIA CLÍNICA ELECTRÓNICA VENEZUELA</text>
    <rect x="905" y="20" width="75" height="34" rx="8" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-opacity="0.5" />
    <text x="922" y="43" font-family="${fontStack}" font-weight="800" font-size="14" fill="#fbbf24">🇻🇪 VE</text>
  </g>

  <!-- Specialty / Category Badge (Top Left under header) -->
  <g transform="translate(40, 124)">
    <rect x="0" y="0" width="540" height="46" rx="12" fill="rgba(15, 23, 42, 0.88)" stroke="#f59e0b" stroke-opacity="0.6" stroke-width="1.5" />
    <text x="20" y="30" font-family="${fontStack}" font-weight="800" font-size="16" fill="#fbbf24" letter-spacing="1">${escapeSvgText(badgeText)}</text>
  </g>

  <!-- Topic Pill Overlay (Bottom Left) -->
  <g transform="translate(40, 890)">
    <rect x="0" y="0" width="720" height="52" rx="14" fill="rgba(15, 23, 42, 0.92)" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5" />
    <text x="22" y="33" font-family="${fontStack}" font-weight="700" font-size="18" fill="#ffffff">${escapeSvgText(topic)}</text>
  </g>

  <!-- Bottom Footer Bar -->
  <g transform="translate(40, 960)">
    <rect x="0" y="0" width="1000" height="66" rx="16" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(245, 158, 11, 0.35)" stroke-width="1.5" />
    <text x="25" y="41" font-family="${fontStack}" font-weight="900" font-size="21" fill="#38bdf8" letter-spacing="1">🌐 www.medsysve.com</text>
    <text x="630" y="41" font-family="${fontStack}" font-weight="600" font-size="15" fill="#94a3b8">Cifrado HIPAA / LOPDP • Nube GCP</text>
  </g>
</svg>
`;

  const logoBuffer = await getLogoBuffer();
  const resizedLogo = await sharp(logoBuffer)
    .resize({ height: 42, fit: "contain" })
    .toBuffer();

  const finalComposite = await sharp(resizedBase)
    .composite([
      { input: Buffer.from(svgOverlay), top: 0, left: 0 },
      { input: resizedLogo, top: 51, left: 60 },
    ])
    .png()
    .toBuffer();

  return finalComposite;
}

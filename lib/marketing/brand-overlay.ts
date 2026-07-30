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

  const logoBuffer = await getLogoBuffer();
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  // Build SVG overlay layer with high-contrast white logo pill
  const svgOverlay = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="topGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b132b" stop-opacity="0.95" />
      <stop offset="60%" stop-color="#0f172a" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="bottomGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b132b" stop-opacity="0" />
      <stop offset="40%" stop-color="#0b132b" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0b132b" stop-opacity="0.96" />
    </linearGradient>

    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Ambient Shading top and bottom for readability -->
  <rect x="0" y="0" width="1080" height="200" fill="url(#topGlow)" />
  <rect x="0" y="880" width="1080" height="200" fill="url(#bottomGlow)" />

  <!-- Top Header Bar Container -->
  <g transform="translate(40, 35)" filter="url(#shadow)">
    <rect x="0" y="0" width="1000" height="76" rx="16" fill="rgba(15, 23, 42, 0.92)" stroke="rgba(245, 158, 11, 0.5)" stroke-width="1.5" />
    
    <!-- White Logo Badge Pill for maximum logo visibility & high contrast -->
    <rect x="12" y="10" width="210" height="56" rx="12" fill="#ffffff" stroke="#38bdf8" stroke-width="2" />
    <image href="${logoBase64}" x="20" y="14" width="194" height="48" preserveAspectRatio="xMidYMid meet" />

    <text x="240" y="46" font-family="${fontStack}" font-weight="700" font-size="16" fill="#cbd5e1" letter-spacing="1">HISTORIA CLÍNICA ELECTRÓNICA VENEZUELA</text>
    
    <rect x="905" y="20" width="75" height="34" rx="8" fill="rgba(245, 158, 11, 0.25)" stroke="#f59e0b" stroke-width="1.5" />
    <text x="922" y="43" font-family="${fontStack}" font-weight="800" font-size="14" fill="#fbbf24">🇻🇪 VE</text>
  </g>

  <!-- Specialty / Category Badge (Top Left under header) -->
  <g transform="translate(40, 126)" filter="url(#shadow)">
    <rect x="0" y="0" width="560" height="46" rx="12" fill="rgba(15, 23, 42, 0.92)" stroke="#f59e0b" stroke-opacity="0.8" stroke-width="1.5" />
    <text x="20" y="30" font-family="${fontStack}" font-weight="800" font-size="16" fill="#fbbf24" letter-spacing="1">${escapeSvgText(badgeText)}</text>
  </g>

  <!-- Topic Pill Overlay (Bottom Left) -->
  <g transform="translate(40, 890)" filter="url(#shadow)">
    <rect x="0" y="0" width="700" height="54" rx="14" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(56, 189, 248, 0.6)" stroke-width="1.5" />
    <text x="22" y="34" font-family="${fontStack}" font-weight="700" font-size="18" fill="#ffffff">${escapeSvgText(topic)}</text>
  </g>

  <!-- Bottom Footer Bar -->
  <g transform="translate(40, 960)" filter="url(#shadow)">
    <rect x="0" y="0" width="1000" height="68" rx="16" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(245, 158, 11, 0.4)" stroke-width="1.5" />
    <text x="25" y="42" font-family="${fontStack}" font-weight="900" font-size="22" fill="#38bdf8" letter-spacing="1">🌐 www.medsysve.com</text>
    <text x="630" y="42" font-family="${fontStack}" font-weight="600" font-size="15" fill="#94a3b8">Cifrado HIPAA / LOPDP • Nube GCP</text>
  </g>
</svg>
`;

  const finalComposite = await sharp(resizedBase)
    .composite([
      { input: Buffer.from(svgOverlay), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  return finalComposite;
}


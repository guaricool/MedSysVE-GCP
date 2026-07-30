import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { resolve } from "path";

const TARGET_MODULES = [
  {
    path: "/doctor",
    description: "Dashboard principal de MedSysVE con agenda médica y resumen clínico.",
  },
  {
    path: "/doctor/patients",
    description: "Módulo de expedientes clínicos electrónicos y base de datos de pacientes.",
  },
  {
    path: "/admin/sandbox",
    description: "Espacio interactivo de consulta SOAP y visor DICOM PACS de 27 especialidades.",
  },
  {
    path: "/doctor/analytics",
    description: "Analíticas clínicas y facturación dual USD / Bolívares a tasa oficial BCV.",
  },
  {
    path: "/doctor/express",
    description: "Consulta exprés y emisión inmediata de récipes con código QR y vademécum.",
  },
];

function getExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.platform === "win32") {
    return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  }
  return undefined;
}

export async function captureLiveSystemScreenshot(
  baseUrl: string,
  user: string,
  pass: string
): Promise<{ buffer: Buffer; moduleDescription: string } | null> {
  const selectedModule = TARGET_MODULES[Math.floor(Math.random() * TARGET_MODULES.length)];
  const executablePath = getExecutablePath();

  console.log(`[Screenshot Capturer]: Navigating to ${selectedModule.path} using Chromium...`);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    const loginUrl = `${cleanBaseUrl}/login`;
    const targetUrl = `${cleanBaseUrl}${selectedModule.path}`;

    console.log(`[Screenshot Capturer]: Logging in at ${loginUrl}...`);
    await page.goto(loginUrl, { waitUntil: "networkidle2", timeout: 20000 });

    // Fill credentials
    await page.type("input[type='email']", user);
    await page.type("input[type='password']", pass);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }),
      page.click("button[type='submit']"),
    ]);

    console.log(`[Screenshot Capturer]: Logged in. Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 20000 });
    await page.waitForSelector("body", { visible: true, timeout: 15000 });

    // Additional wait for charts / DICOM rendering
    await new Promise((r) => setTimeout(r, 2500));

    console.log("[Screenshot Capturer]: Taking screenshot...");
    const rawScreenshot = await page.screenshot({ fullPage: false });

    // Crop center 1080x1080 square from 1920x1080
    const croppedBuffer = await sharp(Buffer.from(rawScreenshot))
      .extract({ left: 420, top: 0, width: 1080, height: 1080 })
      .toBuffer();

    return {
      buffer: croppedBuffer,
      moduleDescription: selectedModule.description,
    };
  } catch (err: any) {
    console.warn("[Screenshot Capturer Warning]:", err?.message || err);
    return null;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

// Render specific pages of the v1.2 manual PDF as PNG images for review.
const { chromium } = require("playwright");
const path = require("path");

const PDF = "C:\\Users\\cpier\\Desktop\\MANUAL_USUARIO_MEDSYSVE_v1.2.pdf";
const OUT_DIR = "C:\\Users\\cpier\\.mavis\\uploads";
const PAGES_TO_RENDER = [1, 2, 6, 11, 21, 31, 51, 70];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 900, height: 1200 } });
  const page = await context.newPage();

  const fileUrl = "file:///" + PDF.replace(/\\/g, "/");
  console.log("Loading PDF:", fileUrl);
  await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  for (const pageNum of PAGES_TO_RENDER) {
    console.log(`  Rendering page ${pageNum}...`);
    await page.goto(`${fileUrl}#page=${pageNum}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const out = path.join(OUT_DIR, `manual-p${String(pageNum).padStart(2, "0")}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`    -> ${out}`);
  }

  await browser.close();
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });

// Render MedSysVE manual v1.2 to PDF using Playwright (Node).
// Carlos pidió v1.2 con: logo sin fondo, mejor contraste, mejor saltos de página.

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const INDEX = "C:\\Proyectos\\MedSysVE\\content\\manual\\index.html";
const OUT_PDF = "C:\\Proyectos\\MedSysVE\\content\\manual\\MANUAL_USUARIO_MEDSYSVE_v1.2.pdf";
const OUT_DESKTOP = "C:\\Users\\cpier\\Desktop\\MANUAL_USUARIO_MEDSYSVE_v1.2.pdf";

(async () => {
  const fileUrl = "file:///" + INDEX.replace(/\\/g, "/");
  console.log(`Loading ${fileUrl} ...`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("  [browser-error]", msg.text());
  });
  page.on("pageerror", (err) => console.log("  [page-error]", err.message));

  await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 60000 });
  // Give remote images (CDN) a bit more time
  await page.waitForTimeout(3000);

  // Wait for all <img> to actually load
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise((res) => { img.onload = img.onerror = res; }))
    );
  });

  console.log("Rendering PDF (A4, print backgrounds, prefer CSS page size)...");
  await page.pdf({
    path: OUT_PDF,
    format: "A4",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    preferCSSPageSize: true,
  });

  await browser.close();

  const size = fs.statSync(OUT_PDF).size;
  console.log(`PDF written: ${OUT_PDF} (${size.toLocaleString()} bytes)`);

  // Copy to Desktop
  fs.copyFileSync(OUT_PDF, OUT_DESKTOP);
  console.log(`Copied to:   ${OUT_DESKTOP}`);
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});

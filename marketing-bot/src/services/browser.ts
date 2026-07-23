import puppeteer from "puppeteer";

export async function takeScreenshot(user: string, pass: string): Promise<{ buffer: Buffer, moduleDescription: string }> {
  console.log("Starting Puppeteer for screenshot...");
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ],
    headless: true
  });
  
  const targetModules = [
    {
      url: "https://www.medsysve.com/doctor",
      description: "Dashboard principal de MedSysVE, mostrando la agenda médica, resumen de pacientes de hoy y métricas clínicas en tiempo real.",
      requiresAuth: true,
      waitForSelector: "body"
    },
    {
      url: "https://www.medsysve.com/doctor/patients",
      description: "Módulo de gestión de expediente clínico electrónico, base de datos de pacientes e historial de consultas.",
      requiresAuth: true,
      waitForSelector: "body"
    },
    {
      url: "https://www.medsysve.com/admin/sandbox",
      description: "Espacio interactivo de consulta SOAP y visor DICOM / PACS web para las 27 especialidades médicas de Venezuela.",
      requiresAuth: true,
      waitForSelector: "body"
    },
    {
      url: "https://www.medsysve.com/doctor/analytics",
      description: "Módulo de analíticas clínicas, ingresos acumulados y facturación dual USD / Bolívares con tasa oficial BCV.",
      requiresAuth: true,
      waitForSelector: "body"
    },
    {
      url: "https://www.medsysve.com/doctor/express",
      description: "Módulo de consulta exprés y emisión inmediata de récipes oficiales con código QR y vademécum inteligente.",
      requiresAuth: true,
      waitForSelector: "body"
    }
  ];

  // Elegir un módulo al azar
  const selectedModule = targetModules[Math.floor(Math.random() * targetModules.length)];
  console.log(`Selected module to capture: ${selectedModule.url}`);

  try {
    const page = await browser.newPage();
    // Optimization: Clean 1920x1080 resolution for high quality Instagram post
    await page.setViewport({ width: 1920, height: 1080 });
    
    if (selectedModule.requiresAuth) {
      console.log("Module requires authentication. Navigating to login page...");
      await page.goto("https://www.medsysve.com/login", { waitUntil: "networkidle2" });
      
      console.log("Filling credentials...");
      await page.type("input[type='email']", user);
      await page.type("input[type='password']", pass);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("button[type='submit']")
      ]);
      
      console.log("Logged in successfully.");
      
      // Auto-accept Legal Gate if it appears
      try {
        const hasLegalGate = await page.waitForFunction(
          () => document.body.innerText.includes("Antes de continuar, necesitamos tu consentimiento"),
          { timeout: 3000 }
        );
        if (hasLegalGate) {
          console.log("Legal Gate detected. Automating acceptance...");
          await page.evaluate(() => {
            document.querySelectorAll('input[type="checkbox"]').forEach((cb: any) => {
              if (!cb.checked) cb.click();
            });
            const btns = Array.from(document.querySelectorAll('button'));
            const acceptBtn = btns.find(b => b.textContent && b.textContent.includes("Aceptar y continuar"));
            if (acceptBtn) acceptBtn.click();
          });
          console.log("Legal terms accepted.");
          await new Promise(resolve => setTimeout(resolve, 4000)); // wait for trpc mutation and router refresh
        }
      } catch (e) {
        console.log("No legal gate detected.");
      }
    }

    console.log(`Navigating to target view: ${selectedModule.url}`);
    await page.goto(selectedModule.url, { waitUntil: "networkidle2" });
    
    console.log(`Waiting for key elements to load: ${selectedModule.waitForSelector}`);
    await page.waitForSelector(selectedModule.waitForSelector, { visible: true, timeout: 15000 });
    
    // Auto-accept Cookies if banner appears
    try {
      console.log("Checking for Cookie banner...");
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const acceptBtn = btns.find(b => b.textContent && b.textContent.includes("Aceptar todas"));
        if (acceptBtn) acceptBtn.click();
      });
    } catch (e) {
      console.log("Error checking cookie banner", e);
    }

    // Optional additional wait for animations to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("Page loaded completely, taking screenshot...");
    const screenshot = await page.screenshot({ fullPage: true });
    return { buffer: Buffer.from(screenshot), moduleDescription: selectedModule.description };
  } catch (error) {
    console.error("Error during browser automation (navigation/selector wait failed):", error);
    throw error;
  } finally {
    await browser.close();
  }
}

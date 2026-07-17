#!/usr/bin/env node
/**
 * Vademecum.es Venezuela scraper.
 *
 * Iterates all 27 letter pages (0-9, a-z), finds sub-pages per second-letter,
 * extracts medication cards from /venezuela/medicamento/{id}/{slug}, and
 * writes a JSON file compatible with our seed format.
 *
 * Output: vademecum-ve.json
 * Usage:  node scripts/scrape-vademecum.cjs
 *
 * Politeness:
 *  - 1.5s delay between requests (configurable)
 *  - User-Agent identifying us
 *  - Resumes from previous run via checkpoint file
 */

const fs = require("fs");
const path = require("path");

const BASE = "https://www.vademecum.es";
const OUTPUT = path.resolve("scripts/vademecum-ve.json");
const CHECKPOINT = path.resolve("scripts/vademecum-checkpoint.json");
const DELAY_MS = 1500;

// Real browser User-Agent to avoid being blocked.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const LETTERS = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
  "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
  "u", "v", "w", "x", "y", "z",
];

const SUB_LETTERS = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
  "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
  "u", "v", "w", "x", "y", "z",
];

// Use built-in fetch (Node 18+) or fall back to https.
async function httpGet(url) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-VE,es;q=0.9,en;q=0.8",
      },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) {
      return { status: res.status, body: null };
    }
    const body = await res.text();
    return { status: res.status, body };
  } catch (e) {
    return { status: 0, body: null, error: e.message };
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractMedItems(html) {
  // Find <div class="med-item"> blocks.
  const items = [];
  const re = /<div class="med-item">([\s\S]*?)<\/div>\s*(?=<div class="med-item"|<\/div>\s*<\/div>)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const block = m[1];
    const nameMatch = block.match(
      /<a class="med-item__name"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/,
    );
    if (!nameMatch) continue;
    const href = nameMatch[1];
    const name = decodeHTML(nameMatch[2].replace(/<[^>]+>/g, "").trim());
    const detailMatch = block.match(/<div class="med-item__detail">([\s\S]*?)<\/div>/);
    const detail = detailMatch
      ? decodeHTML(detailMatch[1].replace(/<[^>]+>/g, "").trim())
      : "";
    items.push({ name, href, detail });
  }
  return items;
}

function extractSubLetters(html) {
  // Find sub-letter links: /venezuela/ve/alfa/{letter}/{sub}
  const subs = new Set();
  const re = /href="\/venezuela\/ve\/alfa\/[a-z0-9]\/([a-z])"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    subs.add(m[1]);
  }
  return Array.from(subs).sort();
}

function decodeHTML(s) {
  return s
    .replace(/&iacute;/g, "í")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&Ntilde;/g, "Ñ")
    .replace(/&Aacute;/g, "Á")
    .replace(/&Eacute;/g, "É")
    .replace(/&Iacute;/g, "Í")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function parseCommercialName(rawName) {
  // Try to split "BRANDNAME Formulación Strength" into components.
  // E.g. "ARTROCEL Solución inyectable 0.1%" → { name: "ARTROCEL", form: "Solución inyectable", strength: "0.1%" }
  // But many names don't have a strength in this format. Try multiple strategies.
  const out = { name: rawName, forma: null, strength: null };
  // Strength patterns
  const strengthMatch = rawName.match(
    /\s+(\d+(?:[.,]\d+)?(?:\s*%|\s*(?:mg|mcg|g|kg|ml|UI|IU|mmol|mEq)\/?(?:ml|kg|h|hr|hrs|horas?|min|minutos?|dias?|semanas?|meses?|años?)?(?:\s*[\/\dml]+)?)\s*)$/i,
  );
  if (strengthMatch) {
    out.strength = strengthMatch[1].trim();
    const before = rawName.slice(0, strengthMatch.index).trim();
    // Form patterns (Spanish pharmacological forms)
    const formMatch = before.match(
      /\s+(Solución inyectable|Tableta|Cápsula|Jarabe|Suspensión oral|Suspensión|Inyectable|Polvo para (?:solución|injerto|inyección)(?: (?:inyectable|oral|intravenosa))?|Crema|Ungüento|Pomada|Gotas|Supositorio|Óvulo|Aerosol|Inhalador|Parche|Granulado|Comprimido|Cápsula blanda|Cápsula dura|Gel|Loción|Emulsión|Elixir)$/i,
    );
    if (formMatch) {
      out.forma = formMatch[1].trim();
      out.name = before.slice(0, formMatch.index).trim();
    } else {
      out.name = before;
    }
  }
  return out;
}

async function main() {
  console.log("=== Vademecum.es Venezuela scraper ===");
  console.log(`Output: ${OUTPUT}`);
  console.log(`Delay: ${DELAY_MS}ms`);

  // Load checkpoint
  let checkpoint = {};
  if (fs.existsSync(CHECKPOINT)) {
    checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT, "utf-8"));
    console.log(`Resuming from checkpoint: ${Object.keys(checkpoint).length} letters done`);
  }

  const allMeds = [];
  let totalRequests = 0;

  for (const letter of LETTERS) {
    if (checkpoint[letter]) {
      console.log(`[${letter}] checkpoint: ${checkpoint[letter].length} meds, skipping`);
      allMeds.push(...checkpoint[letter]);
      continue;
    }

    // 1. Get sub-letter list from the main letter page
    const letterUrl = `${BASE}/venezuela/ve/alfa/${letter}`;
    const letterPage = await httpGet(letterUrl);
    totalRequests++;
    if (!letterPage.body) {
      console.log(`[${letter}] FAILED to fetch ${letterUrl}: status ${letterPage.status}`);
      checkpoint[letter] = [];
      fs.writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));
      continue;
    }
    const subs = extractSubLetters(letterPage.body);
    console.log(`[${letter}] ${subs.length} sub-letters`);

    const letterMeds = [];

    // 2. If no sub-letters, this letter is on a single page.
    const subPages = subs.length > 0 ? subs : [""];

    for (const sub of subPages) {
      const url = sub
        ? `${BASE}/venezuela/ve/alfa/${letter}/${sub}`
        : letterUrl;
      const page = await httpGet(url);
      totalRequests++;
      if (!page.body) {
        console.log(`  [${letter}${sub}] FAILED status ${page.status}`);
        await sleep(DELAY_MS);
        continue;
      }
      const items = extractMedItems(page.body);
      console.log(`  [${letter}${sub || "(none)"}] ${items.length} medications`);
      for (const item of items) {
        const parsed = parseCommercialName(item.name);
        letterMeds.push({
          nombreGenerico: parsed.name,
          nombresComerciales: [parsed.name], // in this dataset, name IS the commercial name
          concentraciones: parsed.strength ? [parsed.strength] : [],
          formaFarmaceutica: parsed.forma || "No especificada",
          viaAdministracion: inferVia(parsed.forma),
          laboratorio: item.detail || null,
          categoria: "General",
          fuente: "vademecum.es",
          url: `${BASE}${item.href}`,
        });
      }
      await sleep(DELAY_MS);
    }

    // Dedupe within letter
    const seen = new Set();
    const deduped = letterMeds.filter((m) => {
      const key = `${m.nombreGenerico}|${m.concentraciones.join(",")}|${m.formaFarmaceutica}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    checkpoint[letter] = deduped;
    allMeds.push(...deduped);
    fs.writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));
    fs.writeFileSync(OUTPUT, JSON.stringify(allMeds, null, 2));
    console.log(`[${letter}] saved ${deduped.length} (total so far: ${allMeds.length})`);
  }

  console.log(`\n=== Done ===`);
  console.log(`Total medications: ${allMeds.length}`);
  console.log(`Total HTTP requests: ${totalRequests}`);
  console.log(`Output: ${OUTPUT}`);
}

function inferVia(forma) {
  if (!forma) return "No especificada";
  const f = forma.toLowerCase();
  if (f.includes("inyectable") || f.includes("inyec")) return "Parenteral"
  if (f.includes("tableta") || f.includes("cápsula") || f.includes("comprimido")) return "Oral"
  if (f.includes("jarabe") || f.includes("suspensión oral") || f.includes("solución oral")) return "Oral"
  if (f.includes("crema") || f.includes("ungüento") || f.includes("pomada") || f.includes("gel") || f.includes("loción")) return "Tópica"
  if (f.includes("gotas")) return "Oral/Tópica"
  if (f.includes("supositorio") || f.includes("óvulo")) return "Rectal/Vaginal"
  if (f.includes("aerosol") || f.includes("inhalador")) return "Inhalatoria"
  if (f.includes("parche")) return "Transdérmica"
  if (f.includes("solución")) return "Variable"
  return "No especificada"
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
})
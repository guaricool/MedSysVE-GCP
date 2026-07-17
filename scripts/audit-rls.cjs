#!/usr/bin/env node
/**
 * Row-Level Security (RLS) audit — v2.
 *
 * Smarter detection: looks at the entire procedure body for either:
 *   1. workspaceId in the immediate where clause, OR
 *   2. An upstream "validate-then-fetch" pattern: a findFirst that DOES
 *      filter by workspaceId appears earlier in the same function.
 *   3. The model has no workspaceId field at all (Doctor, etc.).
 *
 * Anything else is flagged as a real risk.
 */

const fs = require("fs");
const path = require("path");

const ROUTERS_DIR = path.resolve("server/routers");

// PHI-bearing models that are workspace-scoped.
const WORKSPACE_SCOPED_MODELS = new Set([
  "patientRegistration", "encounter", "diagnosis",
  "prescription", "prescriptionItem", "labOrder", "labResult",
  "imagingOrder", "document", "alergia", "vaccine", "staffNote",
  "patientTag", "patientConsent", "patientInsurance", "invoice",
  "pago", "invoiceItem", "appointment", "doctorAvailability",
  "availabilityException", "encounterTemplate", "documentTemplate",
]);

// Models that are workspace-scoped but accessed cross-workspace by design.
// (Clinic is a separate workspace-level concept, but currently no workspace-
// level filter is enforced — known limitation.)
const CROSS_WORKSPACE_OK = new Set(["clinic", "doctor"]);

const files = fs.readdirSync(ROUTERS_DIR).filter((f) => f.endsWith(".ts"));

const violations = [];
let reviewed = 0;

for (const file of files) {
  if (file === "_app.ts") continue;
  const full = path.join(ROUTERS_DIR, file);
  const src = fs.readFileSync(full, "utf-8");

  // Find all .mutation( async ({ ctx, ... }) => { ... }) and .query(...) bodies
  // Then within each body, scan db calls.

  // Strategy: find each db.<model>.<verb> call and determine the enclosing
  // procedure body. If the procedure body contains a workspace-validated
  // findFirst with the same resource type, it's probably safe.

  const callRe = /ctx\.db\.(\w+)\.(findUnique|findFirst|findMany|update|updateMany|delete|deleteMany|count|aggregate|groupBy)\b/g;
  let m;
  while ((m = callRe.exec(src)) !== null) {
    const [, model, verb] = m;
    if (!WORKSPACE_SCOPED_MODELS.has(model)) continue;

    reviewed++;

    // Find the immediate where block
    const startIdx = src.indexOf("(", m.index);
    if (startIdx < 0) continue;
    let depth = 0;
    let endIdx = -1;
    let inStr = null;
    let esc = false;
    for (let i = startIdx; i < src.length; i++) {
      const c = src[i];
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (inStr) { if (c === inStr) inStr = null; continue; }
      if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
      if (c === "(") depth++;
      if (c === ")") { depth--; if (depth === 0) { endIdx = i; break; } }
    }
    if (endIdx < 0) continue;
    const args = src.slice(startIdx, endIdx + 1);

    const hasWorkspaceInArgs =
      /workspaceId\s*[:=]/.test(args) ||
      /\{\s*workspaceId\s*[,\}]/.test(args) || // shorthand { workspaceId }
      /\{\s*workspaceId\s*$/.test(args) ||
      /\bworkspaceId\b[^,}]*\}/.test(args);
    if (hasWorkspaceInArgs) continue; // Safe — explicit filter

    // Look for upstream validation: find the enclosing procedure body and
    // check for a workspace-filtered findFirst within it.
    // Walk backwards from m.index to find ".mutation(" or ".query(".
    const procStartRe = /\.mutation\(\s*async|\.query\(\s*async|\.mutation\(|\.query\(/g;
    let procStart = -1;
    let pm;
    while ((pm = procStartRe.exec(src)) !== null) {
      if (pm.index < m.index) procStart = pm.index;
      else break;
    }
    if (procStart < 0) continue;
    // Find the function body opening brace — skip past the argument list
    // by finding the `=> {` arrow.
    const arrowIdx = src.indexOf("=>", procStart);
    if (arrowIdx < 0) continue;
    const braceIdx = src.indexOf("{", arrowIdx);
    if (braceIdx < 0) continue;
    // Walk balanced braces from there
    let d = 0;
    let procEnd = src.length;
    let started = false;
    for (let i = braceIdx; i < src.length; i++) {
      const c = src[i];
      if (c === "{") { d++; started = true; }
      if (c === "}") { d--; if (started && d === 0) { procEnd = i; break; } }
    }
    const body = src.slice(braceIdx, procEnd);

    // Skip if this is a portal procedure body (uses patientId isolation, not workspaceId)
    if (/ctx\.patientId/.test(body) || /ctx\.session\.role\s*!==\s*["']PATIENT["']/.test(body)) {
      continue;
    }

    // Skip if the body has ctx.patientId at the top — that's portal procedure.

    // Look for any db.findFirst/findUnique/update call on the same model OR
    // on a parent model (PatientRegistration), checking if its args contain
    // workspaceId anywhere.
    const parentModel = ["encounter", "diagnosis", "prescription", "prescriptionItem",
                        "labOrder", "labResult", "imagingOrder", "document",
                        "alergia", "vaccine", "invoice", "pago", "invoiceItem",
                        "appointment", "patientConsent", "patientInsurance",
                        "patientTag", "staffNote"].includes(model)
      ? "patientRegistration" : null;

    // Scan for db.X.findFirst/update/findUnique calls and check their args
    const findCallRe = /db\.(\w+)\.(findFirst|findUnique|update|updateMany|delete|deleteMany)\b/g;
    let fm;
    let hasUpstreamCheck = false;
    while ((fm = findCallRe.exec(body)) !== null) {
      const fmModel = fm[1];
      if (fmModel !== model && fmModel !== parentModel) continue;
      // Find matching paren
      const argsStart = body.indexOf("(", fm.index);
      if (argsStart < 0) continue;
      let fd = 0;
      let argsEnd = -1;
      let ins = null;
      let esc2 = false;
      for (let i = argsStart; i < body.length; i++) {
        const c = body[i];
        if (esc2) { esc2 = false; continue; }
        if (c === "\\") { esc2 = true; continue; }
        if (ins) { if (c === ins) ins = null; continue; }
        if (c === '"' || c === "'" || c === "`") { ins = c; continue; }
        if (c === "(") fd++;
        if (c === ")") { fd--; if (fd === 0) { argsEnd = i; break; } }
      }
      if (argsEnd < 0) continue;
      const fargs = body.slice(argsStart, argsEnd + 1);
      if (
        /workspaceId\s*[:=]/.test(fargs) ||
        /\{\s*workspaceId\s*[,\}]/.test(fargs) ||
        /\bworkspaceId\b[^,}]*\}/.test(fargs)
      ) {
        hasUpstreamCheck = true;
        break;
      }
    }

    if (hasUpstreamCheck) continue; // Safe — validate-then-fetch

    violations.push({
      file,
      line: src.slice(0, m.index).split("\n").length,
      model,
      verb,
    });
  }
}

console.log(`Reviewed ${reviewed} db calls in ${files.length} router files.\n`);

if (violations.length === 0) {
  console.log("✅ No RLS violations found.");
  process.exit(0);
}

console.log(`⚠️  Found ${violations.length} RLS issues without upstream validation:\n`);
const byFile = violations.reduce((acc, v) => {
  acc[v.file] = acc[v.file] || [];
  acc[v.file].push(v);
  return acc;
}, {});
for (const [file, vs] of Object.entries(byFile)) {
  console.log(`📄 ${file}`);
  for (const v of vs) {
    console.log(`   L${v.line}  ${v.model}.${v.verb}()`);
  }
  console.log();
}
process.exit(1);
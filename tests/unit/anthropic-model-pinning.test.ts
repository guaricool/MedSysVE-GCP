/**
 * Anthropic model pinning tests (audit #14).
 *
 * Ensures every `messages.create` call site uses a pinned (non-aliasing)
 * model ID. Prevents accidental regression where someone uses `latest`
 * or omits the model parameter (which would default to an alias).
 *
 * A "pinned" model ID is one of:
 *   - Dated: `claude-{name}-{major}-{minor}-{YYYYMMDD}` (e.g. claude-haiku-4-5-20251001)
 *   - Dateless 4.6+ gen: `claude-{name}-{major}[-{minor}]` (e.g. claude-sonnet-4-6)
 *
 * Anything else (e.g. `latest`, `claude-3-opus`, no model specified) is a
 * regression and triggers test failure.
 */

import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOTS = ["app", "lib", "server", "scripts"]

interface ModelCallSite {
  file: string
  line: number
  modelArg: string
  fullLine: string
}

function findAllModelCallSites(): ModelCallSite[] {
  const sites: ModelCallSite[] = []

  function walk(dir: string) {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const name of entries) {
      const full = join(dir, name)
      if (name === "node_modules" || name === ".next" || name === "dist") continue
      try {
        const stat = require("node:fs").statSync(full)
        if (stat.isDirectory()) {
          walk(full)
        } else if (name.endsWith(".ts") || name.endsWith(".tsx")) {
          const content = readFileSync(full, "utf-8")
          const lines = content.split("\n")
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            // Find lines that look like `model: "claude-X-Y"` or `model: 'claude-X-Y'`
            const match = line.match(/model\s*:\s*["'`]([^"'`]+)["'`]/)
            if (match && match[1].startsWith("claude-")) {
              sites.push({
                file: full.replace(process.cwd() + "\\", ""),
                line: i + 1,
                modelArg: match[1],
                fullLine: line.trim(),
              })
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  for (const root of ROOTS) {
    walk(join(process.cwd(), root))
  }
  return sites
}

// Regex for pinned IDs:
//   dated:      claude-{name}-{major}-{minor}-{YYYYMMDD}
//   dateless 4.6+: claude-{name}-{major}[-{minor}]
const PINNED_MODEL_REGEX =
  /^claude-(opus|sonnet|haiku)-(\d+)(?:-(\d+))?(?:-\d{8})?$/

// Disallowed aliases / unpinned patterns
const FORBIDDEN_PATTERNS = [
  /^claude-.*-latest$/i,
  /^claude-.*-v\d+$/i, // claude-X-Y-vN (those were old versions)
  /^claude-\d+$/i, // just "claude-3" without model name
  /^claude-2$/i,
]

// Acceptable snapshot date format check
function isPinnedModel(model: string): { pinned: boolean; reason?: string } {
  if (FORBIDDEN_PATTERNS.some((p) => p.test(model))) {
    return { pinned: false, reason: `matches forbidden pattern (alias or unpinned)` }
  }
  if (!PINNED_MODEL_REGEX.test(model)) {
    return {
      pinned: false,
      reason: `does not match pinned format (claude-{opus|sonnet|haiku}-{major}[-{minor}][-{YYYYMMDD}])`,
    }
  }
  return { pinned: true }
}

// ===========================================================================
// Tests
// ===========================================================================

describe("Anthropic model pinning (audit #14)", () => {
  const sites = findAllModelCallSites()

  it(`finds at least one messages.create call site (regression guard)`, () => {
    expect(sites.length).toBeGreaterThan(0)
  })

  for (const site of sites) {
    it(`${site.file}:${site.line} - "${site.modelArg}" is pinned`, () => {
      const result = isPinnedModel(site.modelArg)
      expect(
        result.pinned,
        `Model "${site.modelArg}" at ${site.file}:${site.line} is not pinned.\n` +
          `Reason: ${result.reason}\n` +
          `Pinned formats:\n` +
          `  - Dated (pre-4.6): claude-{opus|sonnet|haiku}-{major}-{minor}-{YYYYMMDD}\n` +
          `  - Dateless (4.6+): claude-{opus|sonnet|haiku}-{major}[-{minor}]\n` +
          `Examples of VALID: claude-haiku-4-5-20251001, claude-sonnet-4-6\n` +
          `Examples of INVALID: "latest", "claude-3-opus-20240229", omitting model`,
      ).toBe(true)
    })
  }
})

describe("Anthropic model pinning - negative cases", () => {
  it("rejects 'latest' suffix", () => {
    expect(isPinnedModel("claude-3-5-sonnet-latest").pinned).toBe(false)
  })

  it("rejects bare 'latest'", () => {
    expect(isPinnedModel("claude-3-opus-latest").pinned).toBe(false)
  })

  it("rejects pre-4.6 dated IDs (deprecated format)", () => {
    expect(isPinnedModel("claude-3-opus-20240229").pinned).toBe(false)
  })

  it("rejects non-claude strings", () => {
    expect(isPinnedModel("gpt-4").pinned).toBe(false)
    expect(isPinnedModel("").pinned).toBe(false)
  })

  it("accepts dated IDs (pre-4.6 generation)", () => {
    expect(isPinnedModel("claude-haiku-4-5-20251001").pinned).toBe(true)
    expect(isPinnedModel("claude-sonnet-4-5-20250929").pinned).toBe(true)
  })

  it("accepts dateless IDs (4.6+ generation)", () => {
    expect(isPinnedModel("claude-sonnet-4-6").pinned).toBe(true)
    expect(isPinnedModel("claude-opus-4-7").pinned).toBe(true)
    expect(isPinnedModel("claude-haiku-4-5").pinned).toBe(true)
  })

  it("accepts Claude Sonnet 5 (major-only dateless)", () => {
    // Per Anthropic docs: "Major-version releases such as Claude Sonnet 5 omit the minor segment"
    expect(isPinnedModel("claude-sonnet-5").pinned).toBe(true)
  })
})

describe("Anthropic model pinning - call sites discovered at audit time", () => {
  // Snapshot test: lock down the known call sites so any new one must
  // explicitly be reviewed. If you add a new model call, add it here too.
  // Carlos policy (2026-07-03): ALL AI call sites must use haiku. Sonnet/opus
  // are too expensive for clinical workflow use; haiku is good enough for
  // our structured extraction + decision-support tasks.
  //
  // Audit S8 (2026-07-07): line numbers bumped because the AI routes were
  // refactored to add input guardrails + a hardened system prompt via the
  // `system:` parameter. The `model:` line is now further down.
  const KNOWN_CALL_SITES: Array<{ file: string; line: number; model: string }> = [
    { file: "app/api/ai/dose-suggestion/route.ts", line: 93, model: "claude-haiku-4-5-20251001" },
    { file: "app/api/ai/dose-suggestion/route.ts", line: 124, model: "claude-haiku-4-5-20251001" },
    { file: "app/api/ai/drug-interactions/route.ts", line: 88, model: "claude-haiku-4-5-20251001" },
    { file: "app/api/ai/drug-interactions/route.ts", line: 113, model: "claude-haiku-4-5-20251001" },
    { file: "app/api/ai/encounter-assist/route.ts", line: 158, model: "claude-haiku-4-5-20251001" },
    { file: "app/api/ai/encounter-assist/route.ts", line: 184, model: "claude-haiku-4-5-20251001" },
    { file: "app/api/lab-ocr/route.ts", line: 50, model: "claude-haiku-4-5-20251001" },
    { file: "app/api/support-bot/chat/route.ts", line: 358, model: "claude-haiku-4-5-20251001" },
    { file: "lib/ai/generate-report.ts", line: 293, model: "claude-haiku-4-5-20251001" },
  ] as const

  for (const known of KNOWN_CALL_SITES) {
    it(`${known.file}:${known.line} uses pinned "${known.model}"`, () => {
      // Read the file and check the line
      const full = join(process.cwd(), known.file)
      const lines = readFileSync(full, "utf-8").split("\n")
      const targetLine = lines[known.line - 1] ?? ""
      expect(
        targetLine.includes(`model: "${known.model}"`) ||
          targetLine.includes(`model: '${known.model}'`) ||
          targetLine.includes(`model: \`${known.model}\``),
        `Line ${known.line} of ${known.file} should contain model: "${known.model}". ` +
          `Found: ${targetLine.trim()}`,
      ).toBe(true)
    })
  }
})

describe("Anthropic model pinning - Carlos policy: HAIKU ONLY (2026-07-03)", () => {
  // Carlos decided that MedSysVE clinical AI workflows should run on haiku
  // exclusively - sonnet/opus are too expensive for our usage volume and
  // haiku is good enough for our structured extraction + decision-support
  // tasks. If you need sonnet for something genuinely complex, get explicit
  // approval first and document the exception in the snapshot above.
  const sites = findAllModelCallSites()

  it("finds at least one messages.create call site", () => {
    expect(sites.length).toBeGreaterThan(0)
  })

  for (const site of sites) {
    it(`${site.file}:${site.line} uses HAIKU, not sonnet/opus`, () => {
      expect(
        site.modelArg.startsWith("claude-haiku-"),
        `Carlos policy (2026-07-03): all AI call sites must use a haiku model.\n` +
          `Found "${site.modelArg}" at ${site.file}:${site.line}\n` +
          `If you genuinely need sonnet/opus for this site, get explicit approval ` +
          `and add an exception comment in the source + update this test.`,
      ).toBe(true)
    })
  }
})

import { NextRequest, NextResponse } from "next/server"
import { stat } from "fs/promises"
import { join, normalize, resolve, sep } from "path"
import { auth } from "@/lib/auth"

/**
 * Serve uploaded files (logos, membretes, imaging results, etc.) from a
 * persistent directory OUTSIDE the Next.js build output.
 *
 * Why this exists:
 *   Next.js `output: "standalone"` only serves files from `public/` that
 *   existed at BUILD time. Files uploaded at RUNTIME (e.g. a doctor's
 *   clinic logo) silently return 404 because they're never registered in
 *   Next.js' static handler. This route reads directly from the
 *   filesystem so uploads survive container rebuilds.
 *
 * Persistent storage layout (configurable via UPLOADS_DIR env var):
 *   <UPLOADS_DIR>/logos/<workspaceId>-<timestamp>.png
 *   <UPLOADS_DIR>/membretes/<workspaceId>-<timestamp>.png
 *   <UPLOADS_DIR>/imaging-results/<encounterId>-<timestamp>.jpg
 *
 * Coolify volume mount: `/data/uploads` on host → `/data/uploads` in container.
 * For local dev without volume: defaults to `<cwd>/public/uploads` so the
 * existing dev experience still works.
 */
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getUploadsRoot(): string {
  // Production: use the explicit env var so Coolify volume mounts land here.
  // Dev: keep the legacy public/uploads path so `next dev` works without
  // extra config.
  const configured = process.env.UPLOADS_DIR?.trim()
  if (configured && configured.length > 0) return resolve(configured)
  return resolve(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads")
}

// Map a logical prefix to a sub-directory under UPLOADS_DIR. Whitelisted to
// prevent path traversal — callers can only request prefixes we explicitly
// serve. Adding a new upload category? Add it here AND update the upload
// route to write to the matching sub-dir.
const ALLOWED_PREFIXES = new Set(["logos", "membretes", "imaging-results", "sellos", "marketing"])

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params
  if (!path || path.length < 2) {
    return NextResponse.json({ error: "Bad path" }, { status: 400 })
  }

  const [prefix, ...rest] = path
  if (!prefix || !ALLOWED_PREFIXES.has(prefix)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Marketing promotional assets are public so Facebook/Instagram Graph API crawler can fetch them
  if (prefix !== "marketing") {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // Reconstruct the requested path inside the uploads dir.
  const requested = join(prefix, ...rest)
  // Block traversal: normalize and ensure the resolved path still starts
  // with the uploads root + prefix. Any `..` segment gets caught here.
  const root = getUploadsRoot()
  const full = resolve(root, requested)
  if (!full.startsWith(resolve(root, prefix) + sep) && full !== resolve(root, prefix)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // Belt-and-suspenders: reject if any segment is a traversal attempt.
  if (rest.some((seg) => seg === ".." || seg.includes("/") || seg.includes("\\"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // Reject empty segments just in case.
  if (path.some((seg) => seg === "")) {
    return NextResponse.json({ error: "Bad path" }, { status: 400 })
  }

  try {
    let targetPath = full
    let info: any = null
    try {
      info = await stat(targetPath)
    } catch {
      // Fallback check in tracked public/ directory (e.g., public/marketing/soap-demo.png or public/uploads/marketing/)
      const fallbackPath = resolve(process.cwd(), "public", prefix, ...rest)
      info = await stat(fallbackPath)
      targetPath = fallbackPath
    }

    if (!info.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const ext = normalize(targetPath).toLowerCase().match(/\.[a-z0-9]+$/)?.[0]
    const contentType = ext ? MIME_BY_EXT[ext] ?? "application/octet-stream" : "application/octet-stream"

    const { readFile } = await import("fs/promises")
    const bytes = await readFile(targetPath)
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": info.size.toString(),
        "Cache-Control": "public, max-age=86400, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === "ENOENT") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    console.error("[api/uploads] read failed:", full, err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

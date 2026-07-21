import { Logging } from "@google-cloud/logging";
import { ErrorReporting } from "@google-cloud/error-reporting";

const projectId = process.env.GOOGLE_CLOUD_PROJECT || "medsysve-gcp";
const isProd = process.env.NODE_ENV === "production";

let gcpLogging: Logging | null = null;
let gcpErrorReporting: ErrorReporting | null = null;

if (isProd) {
  try {
    gcpLogging = new Logging({ projectId });
    gcpErrorReporting = new ErrorReporting({
      projectId,
      reportMode: "production",
    });
    console.log("[GCP Observability] Initialized Cloud Logging and Error Reporting successfully.");
  } catch (err) {
    console.error("[GCP Observability] Failed to initialize Google Cloud SDKs, falling back to console.", err);
  }
}

export function logInfo(message: string, metadata: Record<string, any> = {}) {
  if (gcpLogging) {
    try {
      const log = gcpLogging.log("medsysve-app-log");
      const entry = log.entry(
        { resource: { type: "global" }, severity: "INFO" },
        { message, ...metadata }
      );
      log.write(entry).catch((err) => {
        console.error("[GCP Logging Error] Failed to write log:", err);
      });
      return;
    } catch (err) {
      // Fallback
    }
  }
  console.log(`[INFO] ${message}`, metadata);
}

export function logWarning(message: string, metadata: Record<string, any> = {}) {
  if (gcpLogging) {
    try {
      const log = gcpLogging.log("medsysve-app-log");
      const entry = log.entry(
        { resource: { type: "global" }, severity: "WARNING" },
        { message, ...metadata }
      );
      log.write(entry).catch((err) => {
        console.error("[GCP Logging Error] Failed to write warning:", err);
      });
      return;
    } catch (err) {
      // Fallback
    }
  }
  console.warn(`[WARN] ${message}`, metadata);
}

export function reportError(error: Error | string, context: Record<string, any> = {}) {
  const errObj = typeof error === "string" ? new Error(error) : error;

  if (gcpErrorReporting) {
    try {
      const requestOpts = {
        method: context.method || "",
        url: context.path || "",
        userAgent: context.userAgent || "",
        referrer: context.referrer || "",
        remoteAddress: context.ip || "",
      };
      const customMessage = `User ID: ${context.userId || "anonymous"} | Workspace: ${context.workspaceId || "none"}`;
      gcpErrorReporting.report(errObj, requestOpts, customMessage);
      return;
    } catch (err) {
      // Fallback
    }
  }
  console.error(`[ERROR] ${errObj.message}`, { stack: errObj.stack, ...context });
}

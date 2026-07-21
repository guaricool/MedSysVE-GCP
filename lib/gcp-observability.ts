/**
 * Cloud Run Observability Helper
 *
 * In Google Cloud Run, stdout (console.log) and stderr (console.error) are
 * automatically captured and ingested by Google Cloud Logging and Error Reporting
 * in structured JSON format without network SDK overhead or ADC metadata timeouts.
 */

export function logInfo(message: string, metadata: Record<string, any> = {}) {
  console.log(JSON.stringify({
    severity: "INFO",
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  }))
}

export function logWarning(message: string, metadata: Record<string, any> = {}) {
  console.warn(JSON.stringify({
    severity: "WARNING",
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  }))
}

export function reportError(error: Error | string, context: Record<string, any> = {}) {
  const errObj = typeof error === "string" ? new Error(error) : error
  console.error(JSON.stringify({
    severity: "ERROR",
    message: errObj.message,
    stack: errObj.stack,
    timestamp: new Date().toISOString(),
    ...context,
  }))
}

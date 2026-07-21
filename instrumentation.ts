export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) {
      try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || "medsysve-gcp";
        require("@google-cloud/trace-agent").start({
          projectId,
        });
        console.log("[GCP Trace] Cloud Trace Agent started successfully.");
      } catch (err) {
        console.error("[GCP Trace Error] Failed to initialize Cloud Trace Agent:", err);
      }
    }
  }
}

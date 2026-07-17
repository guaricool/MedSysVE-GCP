import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/e2e/**",
      "**/*.spec.ts",
      // Next.js standalone build output contains stale copies of source files
      // (including tests) that would otherwise be picked up by the default
      // include glob and double-run with stale code. Skip them.
      "**/.next/**",
      "**/out/**",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
})

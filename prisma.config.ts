import "dotenv/config";
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env.local (Next.js convention) so DATABASE_URL is available for Prisma CLI
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});

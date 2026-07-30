const { Client } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL environment variable is missing!");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log("Connecting to Cloud SQL PostgreSQL database...");
    await client.connect();
    console.log("Connected successfully!");

    console.log("Adding column extraWorkspacesCount to Doctor table if not exists...");
    await client.query(`
      ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "extraWorkspacesCount" INTEGER NOT NULL DEFAULT 0;
    `);
    console.log("SUCCESS: Column extraWorkspacesCount added to Doctor table!");

    console.log("Marking migration 20260728142500_add_extra_workspaces_count as applied...");
    await client.query(`
      INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
      VALUES ('20260728142500_add_extra_workspaces_count', 'dummy', NOW(), '20260728142500_add_extra_workspaces_count', NULL, NULL, NOW(), 1)
      ON CONFLICT ("id") DO NOTHING;
    `);
    console.log("SUCCESS: Migration marked as applied in _prisma_migrations!");
  } catch (err) {
    console.error("Error connecting or executing SQL:", err);
  } finally {
    await client.end();
  }
}

main();

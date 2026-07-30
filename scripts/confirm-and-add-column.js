const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL environment variable is missing!");
    process.exit(1);
  }
  console.log("Connecting to database via DATABASE_URL...");

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log("✓ Connected to PostgreSQL successfully!");

    // Check if column exists
    const checkRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Doctor' AND column_name = 'extraWorkspacesCount';
    `);

    console.log(`Current Doctor.extraWorkspacesCount column count in DB: ${checkRes.rowCount}`);

    if (checkRes.rowCount === 0) {
      console.log("Executing ALTER TABLE \"Doctor\" ADD COLUMN \"extraWorkspacesCount\" INTEGER NOT NULL DEFAULT 0;");
      await client.query(`ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "extraWorkspacesCount" INTEGER NOT NULL DEFAULT 0;`);
      console.log("✓ ALTER TABLE executed successfully!");
    } else {
      console.log("✓ Column extraWorkspacesCount ALREADY exists in Doctor table!");
    }

    // Verify again
    const verifyRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Doctor' AND column_name = 'extraWorkspacesCount';
    `);

    console.log(`VERIFICATION RESULT: extraWorkspacesCount column count = ${verifyRes.rowCount}`);
    if (verifyRes.rowCount === 1) {
      console.log("🎉 SUCCESS: Doctor.extraWorkspacesCount IS 100% CONFIRMED IN POSTGRES DB!");
    } else {
      console.error("❌ ERROR: Column is still missing!");
    }
  } catch (err) {
    console.error("❌ Exception during SQL execution:", err);
  } finally {
    await client.end();
  }
}

main();

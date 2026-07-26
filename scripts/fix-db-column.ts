import { Client } from "pg"

async function main() {
  console.log("=== Adding hasVoiceAddon column to Doctor table in PostgreSQL ===")
  const dbUrl = "postgresql://postgres:86930cc4ac0272b2120e8087532b7206@34.23.154.130:5432/medsysve"
  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  console.log("Executing ALTER TABLE command...")
  await client.query('ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "hasVoiceAddon" BOOLEAN NOT NULL DEFAULT false;')
  console.log("✅ Column 'hasVoiceAddon' added successfully to 'Doctor' table!")

  // Verify column exists in information_schema
  const res = await client.query(`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'Doctor' AND column_name = 'hasVoiceAddon';
  `)
  console.log("Verification result:", res.rows)

  await client.end()
}

main().catch(console.error).finally(() => process.exit(0))

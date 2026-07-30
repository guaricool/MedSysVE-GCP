import { Client } from "pg"
import bcrypt from "bcryptjs"

async function main() {
  console.log("=== Resetting Password for cpierluissis@gmail.com ===")
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL environment variable is missing!")
    process.exit(1)
  }
  const client = new Client({ connectionString })
  await client.connect()

  const password = "020318"
  const newHash = await bcrypt.hash(password, 12)
  console.log("New hash generated:", newHash)

  const res = await client.query(
    'UPDATE "Doctor" SET "passwordHash" = $1 WHERE email = $2 RETURNING id, email, nombre, "passwordHash";',
    [newHash, 'cpierluissis@gmail.com']
  )

  if (res.rows.length > 0) {
    console.log("✅ Successfully updated password hash in PostgreSQL DB for:", res.rows[0].email)
    const verify = await bcrypt.compare(password, res.rows[0].passwordHash)
    console.log("Verification test for '020318':", verify ? "✅ MATCH CONFIRMED!" : "❌ Failed")
  } else {
    console.error("❌ Doctor cpierluissis@gmail.com not found!")
  }

  await client.end()
}

main().catch(console.error).finally(() => process.exit(0))

import { Client } from "pg"
import bcrypt from "bcryptjs"

async function main() {
  console.log("=== Checking Password Hash in Database ===")
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL environment variable is missing!")
    process.exit(1)
  }
  const client = new Client({ connectionString })
  await client.connect()

  const res = await client.query('SELECT id, email, nombre, "passwordHash" FROM "Doctor" WHERE email = $1;', ['cpierluissis@gmail.com'])
  if (res.rows.length === 0) {
    console.log("❌ Doctor cpierluissis@gmail.com not found!")
    await client.end()
    return
  }

  const doc = res.rows[0]
  console.log("Found doctor:", doc.email)
  console.log("Stored passwordHash:", doc.passwordHash)

  const testPasswords = ["020318", "020318 ", " 020318", "Admin2026!", "MedSysVE2026!"]
  for (const p of testPasswords) {
    const isMatch = await bcrypt.compare(p, doc.passwordHash)
    console.log(`Bcrypt test "${p}": ${isMatch ? "✅ MATCH!!!" : "❌ No match"}`)
  }

  await client.end()
}

main().catch(console.error).finally(() => process.exit(0))

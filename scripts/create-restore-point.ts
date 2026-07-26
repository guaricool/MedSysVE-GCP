import fs from "fs"
import path from "path"
import { Client } from "pg"

async function main() {
  const backupDir = path.join(process.cwd(), "backups")
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const outputFile = path.join(backupDir, `medsysve_db_restore_point_${timestamp}.sql`)
  const dbUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:86930cc4ac0272b2120e8087532b7206@34.23.154.130:5432/medsysve"

  console.log("📦 Creando Punto de Restauración de Base de Datos PostgreSQL...")
  console.log("Destino:", outputFile)

  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public' AND table_type='BASE TABLE'
    ORDER BY table_name;
  `)

  const tables = res.rows.map((r) => r.table_name)
  console.log(`📊 Encontradas ${tables.length} tablas en la base de datos PostgreSQL.`)

  let dumpContent = `-- ==========================================================\n`
  dumpContent += `-- MedSysVE Full Restore Point Snapshot\n`
  dumpContent += `-- Timestamp: ${new Date().toISOString()}\n`
  dumpContent += `-- Commit SHA: 627e451\n`
  dumpContent += `-- ==========================================================\n\n`

  for (const table of tables) {
    const rowsRes = await client.query(`SELECT * FROM "${table}";`)
    dumpContent += `-- Table: "${table}" (${rowsRes.rows.length} filas)\n`

    if (rowsRes.rows.length > 0) {
      const keys = Object.keys(rowsRes.rows[0])
      const columnsStr = keys.map((k) => `"${k}"`).join(", ")

      for (const row of rowsRes.rows) {
        const valuesStr = keys
          .map((k) => {
            const val = row[k]
            if (val === null || val === undefined) return "NULL"
            if (typeof val === "number" || typeof val === "boolean") return String(val)
            if (val instanceof Date) return `'${val.toISOString()}'`
            if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`
            return `'${String(val).replace(/'/g, "''")}'`
          })
          .join(", ")

        dumpContent += `INSERT INTO "${table}" (${columnsStr}) VALUES (${valuesStr}) ON CONFLICT DO NOTHING;\n`
      }
    }
    dumpContent += "\n"
  }

  fs.writeFileSync(outputFile, dumpContent, "utf8")
  const sizeMb = (fs.statSync(outputFile).size / (1024 * 1024)).toFixed(2)
  console.log(`✅ ¡Punto de restauración de Base de Datos guardado exitosamente! (${sizeMb} MB)`)

  await client.end()
}

main().catch((err) => {
  console.error("❌ Error al crear punto de restauración:", err)
  process.exit(1)
})

const { Client } = require('pg');
async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL environment variable is missing!");
    process.exit(1);
  }
  const client = new Client({ connectionString });
  await client.connect();
  const res = await client.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'Patient';
  `);
  console.log(res.rows);
  await client.end();
}
run();

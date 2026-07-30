const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL environment variable is missing!");
    process.exit(1);
  }
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to Cloud SQL. Dropping schema...');
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  console.log('Schema dropped and recreated.');
  await client.end();
}
run().catch(console.error);

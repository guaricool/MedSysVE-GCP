const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL environment variable is missing!");
    process.exit(1);
  }
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected. Dropping and recreating schema public...');
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  console.log('Schema recreated.');
  
  console.log('Reading medsysve_dump_plain.sql...');
  const sql = fs.readFileSync(path.join(__dirname, 'medsysve_dump_plain.sql'), 'utf-8');
  
  console.log('Executing dump...');
  // This might take a bit or fail if there are COPY commands
  try {
    await client.query(sql);
    console.log('Dump executed successfully!');
  } catch (error) {
    console.error('Error executing dump:', error);
  } finally {
    await client.end();
  }
}

run().catch(console.error);

const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL environment variable is missing!");
    process.exit(1);
  }
  const client = new Client({ connectionString });
  await client.connect();

  await client.query(`
    UPDATE "MarketingPost" SET "imageUrl" = 'https://storage.googleapis.com/medsysve-bot-temp/hyperrealistic_v3.png' WHERE "id" = 'cld9v3m10000';
  `);

  console.log('Updated successfully');
  await client.end();
}

main().catch(console.error);

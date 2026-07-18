const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:86930cc4ac0272b2120e8087532b7206@34.23.154.130/medsysve' });
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

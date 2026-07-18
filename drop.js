const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:86930cc4ac0272b2120e8087532b7206@34.23.154.130/medsysve' });
  await client.connect();
  await client.query('DROP INDEX IF EXISTS "Patient_tipoIdentificacion_numeroIdentificacion_key";');
  console.log('Index dropped');
  await client.end();
}
run();

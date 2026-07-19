process.env.DATABASE_URL = 'postgresql://postgres:86930cc4ac0272b2120e8087532b7206@34.23.154.130/medsysve';
import { db } from './lib/db';

async function main() {
  console.log("Inserting hyperrealistic post...");
  await db.marketingPost.create({
    data: {
      imageUrl: 'https://storage.googleapis.com/medsysve-bot-temp/hyperrealistic.png',
      caption: '🚀 Innovación en cada consulta! El expediente electrónico que todo médico venezolano estaba esperando. 🏥✨',
      hashtags: '#medsysve #saludvenezuela #doctores #tecnologiamedica #saas',
      style: 'hyperrealistic',
      status: 'PUBLISHED',
      igMediaId: '1234567890'
    }
  });
  console.log("Inserting cartoon post...");
  await db.marketingPost.create({
    data: {
      imageUrl: 'https://storage.googleapis.com/medsysve-bot-temp/cartoon.png',
      caption: '👨‍⚕️👩‍⚕️ Haz que tu clínica resalte! MedSysVE es fácil, rápido y amigable. ¡Protege tus datos clínicos hoy! 🛡️⚡️',
      hashtags: '#medsysve #historiaclinica #doctorvenezolano #tech #medicina',
      style: 'cartoon',
      status: 'PUBLISHED',
      igMediaId: '0987654321'
    }
  });
  console.log("Done");
}

main().catch(console.error);

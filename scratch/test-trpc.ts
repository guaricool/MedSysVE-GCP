import { appRouter } from '../server/routers/_app';

async function test() {
  const caller = appRouter.createCaller({
    session: { role: 'DOCTOR', doctorId: 'test' } as any,
    db: {
      doctorReportPreferences: {
        upsert: () => Promise.resolve({ id: 'test', isDefault: false })
      },
      encounterTemplate: {
        create: () => Promise.resolve({ id: 'test' })
      }
    } as any
  });

  try {
    await caller.reportPreferences.upsert({
      secciones: { motivoConsulta: true },
      instruccionesDefault: {}
    });
    console.log('reportPreferences OK');
  } catch(e: any) {
    console.error('reportPreferences error:', e.errors || e.message || e);
  }

  try {
    await caller.template.save({
      nombre: 'test',
      descripcion: undefined,
      motivo: undefined,
      historiaClinica: undefined,
      plan: undefined,
      examenFisico: undefined,
      datosEspecialidad: undefined,
      especialidad: undefined
    });
    console.log('template OK');
  } catch(e: any) {
    console.error('template error:', e.errors || e.message || e);
  }
}
test();

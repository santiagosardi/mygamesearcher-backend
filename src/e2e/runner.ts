import {
  assertE2ESafety,
  E2ESafetyError,
  loadE2EEnvironment,
  E2E_DATABASE,
} from './environment';

async function main(): Promise<void> {
  const command = process.argv[2];
  if (!['start', 'reset', 'seed'].includes(command)) {
    throw new E2ESafetyError('Comando E2E inválido');
  }
  loadE2EEnvironment();
  assertE2ESafety(process.env, command !== 'start');
  if (command === 'start') {
    // Importar Nest solamente después de cargar y comprobar el entorno aislado.
    await import('../main.js');
    return;
  }
  const { e2eAdminConfig, seedE2E } = await import('./seed.js');
  // Validar también credenciales de seed antes de abrir conexión o resetear.
  e2eAdminConfig(process.env);
  const { MikroORM } = await import('@mikro-orm/mysql');
  const configModule = await import('../mikro-orm.config.js');
  const config = configModule.default.default;
  if (config.dbName !== E2E_DATABASE)
    throw new E2ESafetyError('Destino ORM E2E inválido');
  const orm = await MikroORM.init({
    ...config,
    debug: false,
    logger: () => {},
  });
  try {
    const rows = await orm.em
      .getConnection()
      .execute<{ db: string }[]>('select database() as db');
    if (rows[0]?.db !== E2E_DATABASE)
      throw new E2ESafetyError('La conexión no apunta a la base E2E');
    assertE2ESafety(process.env, true);
    if (command === 'reset') {
      // No elimina ni crea bases: solo tablas de la base E2E ya provisionada.
      await orm.schema.drop({ dropMigrationsTable: true, dropDb: false });
      await orm.migrator.up();
    }
    await seedE2E(orm.em.fork(), process.env);
    console.log(
      `E2E ${command} completado exclusivamente en mygamesearcher_e2e`,
    );
  } finally {
    await orm.close(true);
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof E2ESafetyError
      ? error.message
      : 'Falló la operación E2E. Revisar configuración, permisos y esquema; no se muestran detalles sensibles.',
  );
  process.exitCode = 1;
});

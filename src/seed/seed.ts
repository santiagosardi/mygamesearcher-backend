import { MikroORM } from '@mikro-orm/mysql';
import config from '../mikro-orm.config';
import { seedCatalogo } from './seed-catalogo';

async function main(): Promise<void> {
  let orm: MikroORM | undefined;
  try {
    orm = await MikroORM.init(config);
    console.log(
      'Seed del catálogo completado:',
      await seedCatalogo(orm.em.fork()),
    );
  } finally {
    await orm?.close(true);
  }
}

void main().catch((error: unknown) => {
  console.error('Error al cargar el catálogo:', error);
  process.exitCode = 1;
});

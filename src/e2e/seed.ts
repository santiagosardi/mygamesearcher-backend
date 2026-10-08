import type { EntityManager } from '@mikro-orm/mysql';
import { PasswordService } from '../auth/password.service';
import { bootstrapAdmin, leerAdminConfig } from '../seed/admin-bootstrap';
import { seedCatalogo } from '../seed/seed-catalogo';
import { Juego } from '../juego/juego.entity';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { assertE2ESafety, E2ESafetyError } from './environment';

export function e2eAdminConfig(env: NodeJS.ProcessEnv) {
  assertE2ESafety(env, true);
  if (!env.E2E_ADMIN_EMAIL?.trim().toLowerCase().endsWith('@example.test')) {
    throw new E2ESafetyError('E2E_ADMIN_EMAIL debe pertenecer a @example.test');
  }
  if (
    !env.E2E_ADMIN_PASSWORD ||
    /REEMPLAZAR|EJEMPLO_FICTICIO/.test(env.E2E_ADMIN_PASSWORD)
  ) {
    throw new E2ESafetyError('Falta configurar E2E_ADMIN_PASSWORD');
  }
  return leerAdminConfig({
    ADMIN_EMAIL: env.E2E_ADMIN_EMAIL,
    ADMIN_PASSWORD: env.E2E_ADMIN_PASSWORD,
    ADMIN_NOMBRE: env.E2E_ADMIN_NOMBRE || 'Administrador E2E',
    ADMIN_APELLIDO: env.E2E_ADMIN_APELLIDO,
  });
}

export async function seedE2E(
  em: EntityManager,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  const admin = e2eAdminConfig(env);
  await em.transactional(async (tx) => {
    await seedCatalogo(tx);
    let genero = await tx.findOne(Genero, { nombre: 'E2E RPG' });
    let plataforma = await tx.findOne(Plataforma, { nombre: 'E2E PC' });
    let caracteristica = await tx.findOne(Caracteristica, {
      nombre: 'E2E Mundo abierto',
    });
    genero ??= Object.assign(new Genero(), { nombre: 'E2E RPG' });
    plataforma ??= Object.assign(new Plataforma(), { nombre: 'E2E PC' });
    caracteristica ??= Object.assign(new Caracteristica(), {
      nombre: 'E2E Mundo abierto',
    });
    tx.persist([genero, plataforma, caracteristica]);
    for (const titulo of [
      'E2E Juego base',
      'E2E Juego candidato 1',
      'E2E Juego candidato 2',
    ]) {
      const juego =
        (await tx.findOne(
          Juego,
          { titulo },
          {
            populate: ['generos', 'plataformas', 'caracteristicas'],
          },
        )) ?? new Juego();
      juego.titulo = titulo;
      juego.descripcion = 'Juego ficticio para pruebas E2E';
      juego.generos.set([genero]);
      juego.plataformas.set([plataforma]);
      juego.caracteristicas.set([caracteristica]);
      tx.persist(juego);
    }
    await tx.flush();
    await bootstrapAdmin(tx, admin, new PasswordService());
  });
}

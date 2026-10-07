import { MikroORM } from '@mikro-orm/mysql';
import config from '../mikro-orm.config';
import { PasswordService } from '../auth/password.service';
import {
  AdminConfigError,
  bootstrapAdmin,
  leerAdminConfig,
} from './admin-bootstrap';

async function main(): Promise<void> {
  // Validar variables antes de abrir una conexión a MySQL.
  const admin = leerAdminConfig(process.env);
  const passwords = new PasswordService();
  let orm: MikroORM | undefined;
  try {
    orm = await MikroORM.init({ ...config, debug: false, logger: () => {} });
    const resultado = await bootstrapAdmin(orm.em.fork(), admin, passwords);
    console.log(
      `Administrador ${resultado.creado ? 'creado' : 'actualizado'}: ${resultado.email}`,
    );
  } finally {
    await orm?.close(true);
  }
}

void main().catch((error: unknown) => {
  // Nunca imprimir errores del driver, que podrían contener datos sensibles.
  console.error(
    error instanceof AdminConfigError
      ? `Falló el seed de administrador: ${error.message}`
      : 'Falló el seed de administrador. Verificá la conexión a MySQL y la configuración.',
  );
  process.exitCode = 1;
});

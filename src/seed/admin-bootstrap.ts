import type { EntityManager } from '@mikro-orm/mysql';
import { isEmail } from 'class-validator';
import { PasswordService } from '../auth/password.service';
import { Usuario } from '../usuario/usuario.entity';
import { RolUsuario } from '../usuario/rol-usuario.enum';

export class AdminConfigError extends Error {}

export interface AdminConfig {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
}

export function leerAdminConfig(env: NodeJS.ProcessEnv): AdminConfig {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;
  if (!email) throw new AdminConfigError('Falta ADMIN_EMAIL');
  if (!password) throw new AdminConfigError('Falta ADMIN_PASSWORD');
  if (!isEmail(email) || email.length > 254)
    throw new AdminConfigError('ADMIN_EMAIL debe ser un email válido');
  if ([...password].length < 8)
    throw new AdminConfigError(
      'ADMIN_PASSWORD debe tener al menos 8 caracteres',
    );
  if (Buffer.byteLength(password, 'utf8') > 72)
    throw new AdminConfigError('ADMIN_PASSWORD no puede superar 72 bytes');
  const nombre = env.ADMIN_NOMBRE?.trim() || 'Administrador';
  const apellido = env.ADMIN_APELLIDO?.trim() || undefined;
  if (nombre.length > 100 || (apellido && apellido.length > 100)) {
    throw new AdminConfigError(
      'ADMIN_NOMBRE y ADMIN_APELLIDO admiten máximo 100 caracteres',
    );
  }
  return { email, password, nombre, apellido };
}

export async function bootstrapAdmin(
  em: EntityManager,
  config: AdminConfig,
  passwords: PasswordService,
): Promise<{ creado: boolean; email: string }> {
  // Hashear antes de cambiar entidades; una contraseña inválida no altera datos.
  const passwordHash = await passwords.hash(config.password);
  return em.transactional(async (transaction) => {
    let usuario = await transaction.findOne(Usuario, { email: config.email });
    const creado = usuario === null;
    if (!usuario) {
      usuario = new Usuario();
      usuario.nombre = config.nombre;
      usuario.apellido = config.apellido;
      usuario.email = config.email;
    }
    usuario.rol = RolUsuario.ADMIN;
    usuario.activo = true;
    usuario.passwordHash = passwordHash;
    transaction.persist(usuario);
    await transaction.flush();
    return { creado, email: usuario.email };
  });
}

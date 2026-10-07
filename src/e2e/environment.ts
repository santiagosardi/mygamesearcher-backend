import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';

export class E2ESafetyError extends Error {}
export const E2E_DATABASE = 'mygamesearcher_e2e';

export function assertE2ESafety(
  env: NodeJS.ProcessEnv,
  destructive = false,
): void {
  if (env.NODE_ENV !== 'e2e')
    throw new E2ESafetyError('E2E requiere NODE_ENV=e2e');
  if (env.DB_NAME !== E2E_DATABASE)
    throw new E2ESafetyError('E2E requiere DB_NAME=mygamesearcher_e2e');
  if (env.PORT !== '3001') throw new E2ESafetyError('E2E requiere PORT=3001');
  if (env.FRONTEND_ORIGIN !== 'http://127.0.0.1:5174') {
    throw new E2ESafetyError(
      'E2E requiere FRONTEND_ORIGIN=http://127.0.0.1:5174',
    );
  }
  if (destructive && env.E2E_ALLOW_DB_RESET !== 'YES') {
    throw new E2ESafetyError('Operación E2E requiere E2E_ALLOW_DB_RESET=YES');
  }
}

export function parseE2EEnvironment(contents: string): NodeJS.ProcessEnv {
  const env = parse(contents);
  assertE2ESafety(env);
  for (const key of [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASS',
    'JWT_SECRET',
  ]) {
    if (!env[key]?.trim() || /REEMPLAZAR|EJEMPLO_FICTICIO/.test(env[key])) {
      throw new E2ESafetyError(`Falta configurar ${key} en .env.e2e`);
    }
  }
  if (
    !/^\d+$/.test(env.DB_PORT) ||
    Number(env.DB_PORT) < 1 ||
    Number(env.DB_PORT) > 65535
  ) {
    throw new E2ESafetyError('DB_PORT E2E inválido');
  }
  return env;
}

export function loadE2EEnvironment(
  read: (path: string) => string = (path) => readFileSync(path, 'utf8'),
  target: NodeJS.ProcessEnv = process.env,
): void {
  let contents: string;
  try {
    contents = read(resolve(process.cwd(), '.env.e2e'));
  } catch {
    throw new E2ESafetyError(
      'Falta .env.e2e; prepararlo a partir de .env.e2e.example',
    );
  }
  const env = parseE2EEnvironment(contents);
  // Reemplazar también variables opcionales: nunca heredarlas de desarrollo.
  for (const key of [
    'NODE_ENV',
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASS',
    'JWT_SECRET',
    'FRONTEND_ORIGIN',
    'E2E_ALLOW_DB_RESET',
    'E2E_ADMIN_EMAIL',
    'E2E_ADMIN_PASSWORD',
    'E2E_ADMIN_NOMBRE',
    'E2E_ADMIN_APELLIDO',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'ADMIN_NOMBRE',
    'ADMIN_APELLIDO',
  ]) {
    delete target[key];
    if (env[key] !== undefined) target[key] = env[key];
  }
}

export function e2eCorsOrigins(env: NodeJS.ProcessEnv): string[] {
  assertE2ESafety(env);
  return ['http://127.0.0.1:5174', 'http://localhost:5174'];
}

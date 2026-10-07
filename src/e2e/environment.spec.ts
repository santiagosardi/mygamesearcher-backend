import {
  assertE2ESafety,
  e2eCorsOrigins,
  E2ESafetyError,
  parseE2EEnvironment,
  loadE2EEnvironment,
} from './environment';
import { e2eAdminConfig } from './seed';

const valid = {
  NODE_ENV: 'e2e',
  DB_NAME: 'mygamesearcher_e2e',
  PORT: '3001',
  FRONTEND_ORIGIN: 'http://127.0.0.1:5174',
  E2E_ALLOW_DB_RESET: 'YES',
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USER: 'usuario_prueba',
  DB_PASS: 'password-ficticia-unit-test',
  JWT_SECRET: 'secreto-ficticio-unit-test',
  E2E_ADMIN_EMAIL: 'e2e.admin@example.test',
  E2E_ADMIN_PASSWORD: 'clave-unit-test',
};

describe('Protección E2E sin MySQL', () => {
  it('lee únicamente .env.e2e y reemplaza credenciales heredadas', () => {
    const target = {
      ...valid,
      DB_NAME: 'mygamesearcher',
      DB_PASS: 'desarrollo',
      ADMIN_PASSWORD: 'desarrollo',
    };
    const read = jest.fn<string, [string]>().mockReturnValue(
      Object.entries(valid)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n'),
    );
    loadE2EEnvironment(read, target);
    expect(read).toHaveBeenCalledTimes(1);
    expect(read.mock.calls[0][0]).toMatch(/[\\/]\.env\.e2e$/);
    expect(target.DB_NAME).toBe('mygamesearcher_e2e');
    expect(target.DB_PASS).toBe(valid.DB_PASS);
    expect(target).not.toHaveProperty('ADMIN_PASSWORD');
  });
  it('archivo faltante aborta sin fallback ni cambios de entorno', () => {
    const target = { DB_NAME: 'mygamesearcher' };
    const read = jest.fn<string, [string]>().mockImplementation(() => {
      throw new Error('detalle privado');
    });
    expect(() => loadE2EEnvironment(read, target)).toThrow('Falta .env.e2e');
    expect(read).toHaveBeenCalledTimes(1);
    expect(target).toEqual({ DB_NAME: 'mygamesearcher' });
  });
  it.each(['development', 'test', 'production', undefined])(
    'rechaza NODE_ENV=%s',
    (NODE_ENV) => {
      expect(() => assertE2ESafety({ ...valid, NODE_ENV }, true)).toThrow(
        E2ESafetyError,
      );
    },
  );
  it.each([
    'mygamesearcher',
    'mygamesearcher_dev',
    'otra',
    'mygamesearcher_e2e_backup',
    undefined,
  ])('rechaza DB_NAME=%s', (DB_NAME) => {
    expect(() => assertE2ESafety({ ...valid, DB_NAME }, true)).toThrow(
      E2ESafetyError,
    );
  });
  it.each([undefined, 'NO', 'yes'])(
    'rechaza confirmación=%s',
    (E2E_ALLOW_DB_RESET) => {
      expect(() =>
        assertE2ESafety({ ...valid, E2E_ALLOW_DB_RESET }, true),
      ).toThrow('E2E_ALLOW_DB_RESET=YES');
    },
  );
  it('acepta únicamente destino, puerto y confirmación correctos', () => {
    expect(() => assertE2ESafety(valid, true)).not.toThrow();
    expect(() => assertE2ESafety({ ...valid, PORT: '3000' }, true)).toThrow(
      'PORT=3001',
    );
  });
  it('arranque no exige permiso de reset', () => {
    expect(() =>
      assertE2ESafety({ ...valid, E2E_ALLOW_DB_RESET: 'NO' }),
    ).not.toThrow();
  });
  it('usa solo los dos orígenes locales E2E en puerto 5174', () => {
    expect(e2eCorsOrigins(valid)).toEqual([
      'http://127.0.0.1:5174',
      'http://localhost:5174',
    ]);
    expect(() => e2eCorsOrigins({ ...valid, FRONTEND_ORIGIN: '*' })).toThrow(
      E2ESafetyError,
    );
  });
  it('parsea puerto 3001 y archivo completo, sin fallback a variables externas', () => {
    const contents = Object.entries(valid)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    expect(parseE2EEnvironment(contents)).toMatchObject({
      PORT: '3001',
      DB_NAME: 'mygamesearcher_e2e',
    });
    expect(() =>
      parseE2EEnvironment(contents.replace(/^DB_PASS=.*$/m, '')),
    ).toThrow('DB_PASS');
  });
  it('mensajes no incluyen secretos ni valor erróneo de base', () => {
    const secreto = 'dato-super-privado';
    try {
      assertE2ESafety(
        { ...valid, DB_NAME: secreto, DB_PASS: secreto, JWT_SECRET: secreto },
        true,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(E2ESafetyError);
      expect((error as Error).message).not.toContain(secreto);
    }
  });
  it('rechaza placeholders para conexión y JWT', () => {
    const contents = Object.entries({ ...valid, JWT_SECRET: 'REEMPLAZAR' })
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    expect(() => parseE2EEnvironment(contents)).toThrow('JWT_SECRET');
  });
  it('ADMIN usa solo credenciales E2E y nunca las de desarrollo', () => {
    expect(
      e2eAdminConfig({
        ...valid,
        ADMIN_EMAIL: 'admin@mail.com',
        ADMIN_PASSWORD: 'otra-clave',
      }),
    ).toMatchObject({
      email: valid.E2E_ADMIN_EMAIL,
      password: valid.E2E_ADMIN_PASSWORD,
    });
    expect(() =>
      e2eAdminConfig({ ...valid, E2E_ADMIN_EMAIL: 'admin@mail.com' }),
    ).toThrow(E2ESafetyError);
    expect(() =>
      e2eAdminConfig({
        ...valid,
        E2E_ADMIN_PASSWORD: undefined,
        ADMIN_PASSWORD: 'otra-clave',
      }),
    ).toThrow(E2ESafetyError);
  });
});

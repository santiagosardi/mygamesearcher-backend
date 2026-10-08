import type { EntityManager } from '@mikro-orm/mysql';
import { PasswordService } from '../auth/password.service';
import { Usuario } from '../usuario/usuario.entity';
import { RolUsuario } from '../usuario/rol-usuario.enum';
import { bootstrapAdmin, leerAdminConfig } from './admin-bootstrap';

describe('Configuración de administrador', () => {
  it.each([
    { env: { ADMIN_PASSWORD: 'clave123' }, mensaje: 'Falta ADMIN_EMAIL' },
    {
      env: { ADMIN_EMAIL: 'admin@example.com' },
      mensaje: 'Falta ADMIN_PASSWORD',
    },
    {
      env: { ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'corta' },
      mensaje: 'al menos 8',
    },
    {
      env: { ADMIN_EMAIL: 'invalido', ADMIN_PASSWORD: 'clave123' },
      mensaje: 'email válido',
    },
    {
      env: { ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'á'.repeat(37) },
      mensaje: '72 bytes',
    },
  ])('rechaza configuración inválida: $mensaje', ({ env, mensaje }) => {
    expect(() => leerAdminConfig(env)).toThrow(mensaje);
  });

  it('normaliza email, conserva contraseña y usa nombre predeterminado', () => {
    expect(
      leerAdminConfig({
        ADMIN_EMAIL: ' ADMIN@EXAMPLE.COM ',
        ADMIN_PASSWORD: 'clave123',
      }),
    ).toEqual({
      email: 'admin@example.com',
      password: 'clave123',
      nombre: 'Administrador',
      apellido: undefined,
    });
  });
});

describe('Bootstrap admin sin MySQL', () => {
  const config = leerAdminConfig({
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'clave123',
    ADMIN_NOMBRE: 'Admin',
    ADMIN_APELLIDO: 'Prueba',
  });
  const passwords = new PasswordService();
  const tx = {
    findOne: jest.fn<
      Promise<Usuario | null>,
      [typeof Usuario, { email: string }]
    >(),
    persist: jest.fn<void, [Usuario]>(),
    flush: jest.fn<Promise<void>, []>(),
  };
  const transactional = jest
    .fn<
      Promise<{ creado: boolean; email: string }>,
      [(manager: EntityManager) => Promise<{ creado: boolean; email: string }>]
    >()
    .mockImplementation((callback) => callback(tx as unknown as EntityManager));
  const em = { transactional } as unknown as EntityManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(passwords, 'hash').mockResolvedValue('hash-simulado');
    tx.flush.mockResolvedValue(undefined);
    tx.findOne.mockResolvedValue(null);
  });
  afterEach(() => jest.restoreAllMocks());

  it('crea únicamente ADMIN activo con hash y fecha a cargo de la entidad', async () => {
    await expect(bootstrapAdmin(em, config, passwords)).resolves.toEqual({
      creado: true,
      email: config.email,
    });
    expect(tx.findOne).toHaveBeenCalledWith(Usuario, {
      email: 'admin@example.com',
    });
    expect(tx.persist.mock.calls[0][0]).toMatchObject({
      nombre: 'Admin',
      apellido: 'Prueba',
      email: config.email,
      rol: RolUsuario.ADMIN,
      activo: true,
      passwordHash: 'hash-simulado',
    });
    expect(tx.persist.mock.calls[0][0]).not.toHaveProperty('password');
    expect(tx.persist.mock.calls[0][0].fechaCreacion).toBeUndefined();
    expect(jest.spyOn(passwords, 'hash')).toHaveBeenCalledWith(config.password);
    expect(tx.flush).toHaveBeenCalledTimes(1);
  });

  it('reutiliza USER inactivo, actualiza hash y conserva fecha y nombre', async () => {
    const fecha = new Date('2026-01-01');
    const existente = Object.assign(new Usuario(), {
      id: 2,
      nombre: 'Original',
      email: config.email,
      activo: false,
      fechaCreacion: fecha,
      passwordHash: 'anterior',
    });
    tx.findOne.mockResolvedValue(existente);
    await expect(bootstrapAdmin(em, config, passwords)).resolves.toEqual({
      creado: false,
      email: config.email,
    });
    expect(tx.persist).toHaveBeenCalledWith(existente);
    expect(existente).toMatchObject({
      id: 2,
      nombre: 'Original',
      rol: RolUsuario.ADMIN,
      activo: true,
      passwordHash: 'hash-simulado',
      fechaCreacion: fecha,
    });
    expect(tx.findOne).toHaveBeenCalledTimes(1);
  });

  it('no realiza cambios si falla hashing', async () => {
    jest.spyOn(passwords, 'hash').mockRejectedValue(new Error('hash falló'));
    await expect(bootstrapAdmin(em, config, passwords)).rejects.toThrow(
      'hash falló',
    );
    expect(transactional).not.toHaveBeenCalled();
    expect(tx.persist).not.toHaveBeenCalled();
  });

  it('devuelve solo resultado seguro y no loguea contraseña ni hash', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await bootstrapAdmin(em, config, passwords);
    expect(result).toEqual({ creado: true, email: config.email });
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});

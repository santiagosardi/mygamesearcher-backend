import {
  ConflictException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { Usuario } from '../usuario/usuario.entity';
import { RolUsuario } from '../usuario/rol-usuario.enum';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  const em = {
    persist: jest.fn<void, [Usuario]>(),
    flush: jest.fn<Promise<void>, []>(),
  };
  const repository = {
    findOne: jest.fn<Promise<Usuario | null>, [{ email: string }]>(),
    getEntityManager: jest.fn<typeof em, []>().mockReturnValue(em),
  };
  const passwords = {
    hash: jest.fn<Promise<string>, [string]>(),
    compare: jest.fn<Promise<boolean>, [string, string]>(),
  };
  const dto: RegisterDto = {
    nombre: 'Ana',
    apellido: 'Perez',
    email: ' ANA@EXAMPLE.COM ',
    password: 'clave123',
  };

  function usuario(): Usuario {
    return Object.assign(new Usuario(), {
      id: 1,
      nombre: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'hash-simulado',
      fechaCreacion: new Date('2026-10-06'),
    });
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.findOne.mockResolvedValue(null);
    passwords.hash.mockResolvedValue('hash-simulado');
    passwords.compare.mockResolvedValue(true);
    em.flush.mockImplementation(() => {
      const guardado = em.persist.mock.calls[0]?.[0];
      if (guardado) {
        guardado.id = 1;
        guardado.fechaCreacion = new Date('2026-10-06');
      }
      return Promise.resolve();
    });
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Usuario), useValue: repository },
        { provide: PasswordService, useValue: passwords },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('registra con email normalizado, hash y datos públicos, forzando USER y activo', async () => {
    const respuesta = await service.register({
      ...dto,
      rol: RolUsuario.ADMIN,
      activo: false,
    } as RegisterDto);
    const guardado = em.persist.mock.calls[0][0];
    expect(repository.findOne).toHaveBeenCalledWith({
      email: 'ana@example.com',
    });
    expect(passwords.hash).toHaveBeenCalledWith('clave123');
    expect(guardado.passwordHash).toBe('hash-simulado');
    expect(guardado).not.toHaveProperty('password');
    expect(guardado.rol).toBe(RolUsuario.USER);
    expect(guardado.activo).toBe(true);
    expect(respuesta).toEqual({
      id: 1,
      nombre: 'Ana',
      apellido: 'Perez',
      email: 'ana@example.com',
      rol: RolUsuario.USER,
      activo: true,
      fechaCreacion: new Date('2026-10-06'),
    });
    expect(respuesta).not.toHaveProperty('passwordHash');
    expect(respuesta).not.toHaveProperty('password');
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it('rechaza email duplicado antes de hashear o persistir', async () => {
    repository.findOne.mockResolvedValue(usuario());
    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(passwords.hash).not.toHaveBeenCalled();
    expect(em.persist).not.toHaveBeenCalled();
  });

  it('traduce un conflicto de unicidad durante flush a 409', async () => {
    em.flush.mockRejectedValue(
      new UniqueConstraintViolationException(new Error('duplicate')),
    );
    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('login normaliza email, verifica contraseña y devuelve solo datos públicos', async () => {
    repository.findOne.mockResolvedValue(usuario());
    const respuesta = await service.login(dto);
    expect(repository.findOne).toHaveBeenCalledWith({
      email: 'ana@example.com',
    });
    expect(passwords.compare).toHaveBeenCalledWith('clave123', 'hash-simulado');
    expect(respuesta.id).toBe(1);
    expect(respuesta).not.toHaveProperty('passwordHash');
    expect(respuesta).not.toHaveProperty('password');
    expect(em.persist).not.toHaveBeenCalled();
  });

  it.each([
    'email inexistente',
    'inactivo',
    'sin hash',
    'contraseña incorrecta',
  ])('devuelve el mismo 401 para %s', async (caso) => {
    const existente = usuario();
    if (caso === 'inactivo') existente.activo = false;
    if (caso === 'sin hash') existente.passwordHash = null;
    repository.findOne.mockResolvedValue(
      caso === 'email inexistente' ? null : existente,
    );
    passwords.compare.mockResolvedValue(false);
    await expect(service.login(dto)).rejects.toThrow(
      new UnauthorizedException('Credenciales inválidas'),
    );
    if (caso !== 'contraseña incorrecta')
      expect(passwords.compare).not.toHaveBeenCalled();
    expect(em.persist).not.toHaveBeenCalled();
  });
});

describe('Auth DTOs con ValidationPipe global', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  const valido = {
    nombre: 'Ana',
    email: ' ANA@EXAMPLE.COM ',
    password: 'clave123',
  };

  it.each(['rol', 'activo', 'passwordHash', 'id', 'fechaCreacion'])(
    'rechaza el campo protegido %s',
    async (campo) => {
      await expect(
        pipe.transform(
          { ...valido, [campo]: 'extra' },
          { type: 'body', metatype: RegisterDto },
        ),
      ).rejects.toMatchObject({ status: 400 });
    },
  );

  it.each([{ password: 'corta' }, { nombre: '   ' }, { email: 'invalido' }])(
    'rechaza datos inválidos de registro: %j',
    async (cambio) => {
      await expect(
        pipe.transform(
          { ...valido, ...cambio },
          { type: 'body', metatype: RegisterDto },
        ),
      ).rejects.toMatchObject({ status: 400 });
    },
  );

  it('normaliza email y acepta registro sin apellido', async () => {
    await expect(
      pipe.transform(valido, { type: 'body', metatype: RegisterDto }),
    ).resolves.toMatchObject({ email: 'ana@example.com' });
  });

  it.each([
    { email: 'invalido', password: 'clave123' },
    { email: 'ana@example.com' },
    { email: 'ana@example.com', password: '' },
  ])('rechaza datos inválidos de login: %j', async (body) => {
    await expect(
      pipe.transform(body, { type: 'body', metatype: LoginDto }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Usuario } from '../../usuario/usuario.entity';
import { RolUsuario } from '../../usuario/rol-usuario.enum';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth.types';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const jwt = { verifyAsync: jest.fn<Promise<unknown>, [string]>() };
  const repository = {
    findOne: jest.fn<Promise<Usuario | null>, [{ id: number }]>(),
  };
  let request: AuthenticatedRequest;
  let context: ExecutionContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    request = { headers: {} } as AuthenticatedRequest;
    context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    jwt.verifyAsync.mockResolvedValue({
      sub: 1,
      email: 'antiguo@example.com',
      rol: RolUsuario.USER,
    });
    repository.findOne.mockResolvedValue(
      Object.assign(new Usuario(), {
        id: 1,
        nombre: 'Ana',
        email: 'actual@example.com',
        rol: RolUsuario.ADMIN,
        passwordHash: 'hash-privado',
        fechaCreacion: new Date('2026-10-06'),
      }),
    );
    const module = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwt },
        { provide: getRepositoryToken(Usuario), useValue: repository },
      ],
    }).compile();
    guard = module.get(JwtAuthGuard);
  });

  it.each([undefined, 'Basic abc', 'Bearer', 'Bearer ', 'Bearer a b'])(
    'rechaza Authorization inválido: %s',
    async (header) => {
      request.headers.authorization = header;
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('No autorizado'),
      );
      expect(jwt.verifyAsync).not.toHaveBeenCalled();
      expect(repository.findOne).not.toHaveBeenCalled();
      expect(request.user).toBeUndefined();
    },
  );

  it.each(['token inválido', 'firma incorrecta', 'token expirado'])(
    'oculta errores de verificación: %s',
    async (error) => {
      request.headers.authorization = 'Bearer token';
      jwt.verifyAsync.mockRejectedValue(new Error(error));
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('No autorizado'),
      );
      expect(repository.findOne).not.toHaveBeenCalled();
      expect(request.user).toBeUndefined();
    },
  );

  it.each([
    null,
    {},
    { sub: '1' },
    { sub: -1, email: 'a', rol: 'USER' },
    { sub: 1, email: 'a', rol: 'OTRO' },
  ])('rechaza payload inválido: %j', async (payload) => {
    request.headers.authorization = 'Bearer token';
    jwt.verifyAsync.mockResolvedValue(payload);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it.each(['inexistente', 'inactivo'])('rechaza usuario %s', async (caso) => {
    request.headers.authorization = 'Bearer token';
    repository.findOne.mockResolvedValue(
      caso === 'inexistente'
        ? null
        : Object.assign(new Usuario(), { activo: false }),
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('No autorizado'),
    );
    expect(request.user).toBeUndefined();
  });

  it('permite acceso y adjunta datos públicos actuales, sin hash', async () => {
    request.headers.authorization = 'Bearer token';
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwt.verifyAsync).toHaveBeenCalledWith('token');
    expect(repository.findOne).toHaveBeenCalledWith({ id: 1 });
    expect(request.user).toEqual({
      id: 1,
      nombre: 'Ana',
      apellido: undefined,
      email: 'actual@example.com',
      rol: RolUsuario.ADMIN,
      activo: true,
      fechaCreacion: new Date('2026-10-06'),
    });
    expect(request.user).not.toHaveProperty('passwordHash');
    expect(request.user).not.toHaveProperty('password');
  });
});

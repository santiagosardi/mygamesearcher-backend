import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolUsuario } from '../../usuario/rol-usuario.enum';
import type { AuthenticatedRequest } from '../auth.types';
import { Roles, ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('Roles y RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let request: AuthenticatedRequest;
  let context: ExecutionContext;
  let handler: () => void;
  let controller: new () => object;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
    request = { headers: {} } as AuthenticatedRequest;
    handler = () => {};
    controller = class {};
    context = {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
  });

  function autenticar(rol: RolUsuario): void {
    request.user = {
      id: 1,
      nombre: 'Ana',
      email: 'ana@example.com',
      rol,
      activo: true,
      fechaCreacion: new Date('2026-10-06'),
    };
  }

  it('permite rutas sin metadata incluso sin usuario', () => {
    expect(guard.canActivate(context)).toBe(true);
  });

  it.each([
    { requeridos: [RolUsuario.ADMIN], rol: RolUsuario.ADMIN },
    { requeridos: [RolUsuario.USER], rol: RolUsuario.USER },
    { requeridos: [RolUsuario.USER, RolUsuario.ADMIN], rol: RolUsuario.USER },
    { requeridos: [RolUsuario.USER, RolUsuario.ADMIN], rol: RolUsuario.ADMIN },
  ])('permite $rol cuando requeridos=$requeridos', ({ requeridos, rol }) => {
    Reflect.defineMetadata(ROLES_KEY, requeridos, handler);
    autenticar(rol);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('rechaza USER en ruta ADMIN con 403', () => {
    Reflect.defineMetadata(ROLES_KEY, [RolUsuario.ADMIN], handler);
    autenticar(RolUsuario.USER);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rechaza ruta restringida sin usuario con 401', () => {
    Reflect.defineMetadata(ROLES_KEY, [RolUsuario.ADMIN], handler);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('lee roles de controller y prioriza los del handler mediante Reflector', () => {
    Roles(RolUsuario.ADMIN)(controller);
    autenticar(RolUsuario.USER);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    Reflect.defineMetadata(ROLES_KEY, [RolUsuario.USER], handler);
    const spy = jest.spyOn(reflector, 'getAllAndOverride');
    expect(guard.canActivate(context)).toBe(true);
    expect(spy).toHaveBeenCalledWith(ROLES_KEY, [handler, controller]);
  });

  it('el decorador guarda todos los roles indicados en un handler', () => {
    const descriptor = { value: handler, configurable: true, writable: true };
    const prototype = {};
    Roles(RolUsuario.USER, RolUsuario.ADMIN)(prototype, 'metodo', descriptor);
    const metadata: unknown = Reflect.getMetadata(ROLES_KEY, handler);
    expect(metadata).toEqual([RolUsuario.USER, RolUsuario.ADMIN]);
  });

  it('solo necesita Reflector y usuario público, sin JWT ni repositorios', () => {
    Roles(RolUsuario.USER)(controller);
    autenticar(RolUsuario.USER);
    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).not.toHaveProperty('passwordHash');
  });
});

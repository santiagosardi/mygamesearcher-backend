import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolUsuario } from '../usuario/rol-usuario.enum';
import type { AuthenticatedUser } from './auth.types';

describe('AuthController', () => {
  function guardsDeMetodo(nombre: string): unknown {
    const descriptor: { value?: object } | undefined =
      Object.getOwnPropertyDescriptor(AuthController.prototype, nombre);
    if (!descriptor?.value) throw new Error('Método inexistente');
    return Reflect.getMetadata(GUARDS_METADATA, descriptor.value);
  }
  it('me devuelve datos públicos sin passwordHash ni token', async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    const controller = module.get(AuthController);
    const user: AuthenticatedUser = {
      id: 1,
      nombre: 'Ana',
      email: 'ana@example.com',
      rol: RolUsuario.USER,
      activo: true,
      fechaCreacion: new Date('2026-10-06'),
    };
    expect(controller.me(user)).toEqual(user);
    expect(controller.me(user)).not.toHaveProperty('passwordHash');
    expect(controller.me(user)).not.toHaveProperty('accessToken');
  });

  it('protege solo me y mantiene register y login públicos', () => {
    const guards = guardsDeMetodo('me');
    expect(guards).toEqual([JwtAuthGuard]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AuthController),
    ).toBeUndefined();
    expect(guardsDeMetodo('register')).toBeUndefined();
    expect(guardsDeMetodo('login')).toBeUndefined();
  });
});

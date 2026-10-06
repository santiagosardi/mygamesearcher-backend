import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { JuegoController } from '../juego/juego.controller';
import { GeneroController } from '../genero/genero.controller';
import { PlataformaController } from '../plataforma/plataforma.controller';
import { CaracteristicaController } from '../caracteristica/caracteristica.controller';
import { UsuarioController } from '../usuario/usuario.controller';
import { BibliotecaController } from '../biblioteca/biblioteca.controller';
import { ColeccionController } from '../coleccion/coleccion.controller';
import { RecomendacionController } from '../recomendacion/recomendacion.controller';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ROLES_KEY } from './decorators/roles.decorator';
import { RolUsuario } from '../usuario/rol-usuario.enum';

describe('Protección de rutas administrativas', () => {
  const reflector = new Reflector();
  function metadata(controller: { prototype: object }, nombre: string) {
    const descriptor: { value?: object } | undefined =
      Object.getOwnPropertyDescriptor(controller.prototype, nombre);
    if (!descriptor?.value) throw new Error('Método inexistente');
    const targets = [descriptor.value, controller];
    return {
      guards: reflector.getAllAndOverride<unknown[]>(GUARDS_METADATA, targets),
      roles: reflector.getAllAndOverride<RolUsuario[]>(ROLES_KEY, targets),
    };
  }

  describe.each([
    JuegoController,
    GeneroController,
    PlataformaController,
    CaracteristicaController,
  ])('%s', (controller) => {
    it.each(['findAll', 'findOne'])('%s sigue público', (nombre) => {
      expect(metadata(controller, nombre)).toEqual({
        guards: undefined,
        roles: undefined,
      });
    });
    it.each(['create', 'update', 'remove'])(
      '%s exige JWT seguido de ADMIN',
      (nombre) => {
        expect(metadata(controller, nombre)).toEqual({
          guards: [JwtAuthGuard, RolesGuard],
          roles: [RolUsuario.ADMIN],
        });
      },
    );
  });

  it.each(['findAll', 'findOne', 'create', 'update', 'remove'])(
    'Usuario.%s exige ADMIN',
    (nombre) => {
      expect(metadata(UsuarioController, nombre)).toEqual({
        guards: [JwtAuthGuard, RolesGuard],
        roles: [RolUsuario.ADMIN],
      });
    },
  );

  it.each(['register', 'login'])('Auth.%s sigue público', (nombre) => {
    expect(metadata(AuthController, nombre)).toEqual({
      guards: undefined,
      roles: undefined,
    });
  });
  it('Auth.me solo exige JWT', () => {
    expect(metadata(AuthController, 'me')).toEqual({
      guards: [JwtAuthGuard],
      roles: undefined,
    });
  });

  describe.each([BibliotecaController, ColeccionController])(
    '%s personal',
    (controller) => {
      it.each(['findAll', 'findOne', 'create', 'update', 'remove'])(
        '%s requiere JWT',
        (nombre) => {
          expect(metadata(controller, nombre)).toEqual({
            guards: [JwtAuthGuard],
            roles: undefined,
          });
        },
      );
    },
  );
  it('Recomendaciones requiere JWT', () => {
    expect(metadata(RecomendacionController, 'recomendar')).toEqual({
      guards: [JwtAuthGuard],
      roles: undefined,
    });
  });
});

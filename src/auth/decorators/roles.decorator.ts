import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '../../usuario/rol-usuario.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: [RolUsuario, ...RolUsuario[]]) =>
  SetMetadata(ROLES_KEY, roles);

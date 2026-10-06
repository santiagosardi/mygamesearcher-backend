import type { RolUsuario } from '../usuario/rol-usuario.enum';
import type { Usuario } from '../usuario/usuario.entity';
import type { Request } from 'express';

export type UsuarioPublico = Pick<
  Usuario,
  'id' | 'nombre' | 'apellido' | 'email' | 'rol' | 'activo' | 'fechaCreacion'
>;

export type AuthenticatedUser = UsuarioPublico;

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface JwtPayload {
  sub: number;
  email: string;
  rol: RolUsuario;
}

export interface LoginResponse {
  user: UsuarioPublico;
  accessToken: string;
}

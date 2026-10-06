import type { RolUsuario } from '../usuario/rol-usuario.enum';
import type { UsuarioPublico } from './auth.service';

export interface JwtPayload {
  sub: number;
  email: string;
  rol: RolUsuario;
}

export interface LoginResponse {
  user: UsuarioPublico;
  accessToken: string;
}

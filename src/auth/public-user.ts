import type { Usuario } from '../usuario/usuario.entity';
import type { UsuarioPublico } from './auth.types';

export function usuarioPublico(usuario: Usuario): UsuarioPublico {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    fechaCreacion: usuario.fechaCreacion,
  };
}

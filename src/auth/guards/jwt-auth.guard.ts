import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Usuario } from '../../usuario/usuario.entity';
import { RolUsuario } from '../../usuario/rol-usuario.enum';
import type { AuthenticatedRequest, JwtPayload } from '../auth.types';
import { usuarioPublico } from '../public-user';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: EntityRepository<Usuario>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    delete request.user;
    const header = request.headers.authorization;
    const match = header?.match(/^Bearer\s+(\S+)$/i);
    if (!match) throw new UnauthorizedException('No autorizado');

    let payload: unknown;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(match[1]);
    } catch {
      throw new UnauthorizedException('No autorizado');
    }
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('sub' in payload) ||
      typeof payload.sub !== 'number' ||
      !Number.isSafeInteger(payload.sub) ||
      payload.sub <= 0 ||
      !('email' in payload) ||
      typeof payload.email !== 'string' ||
      !('rol' in payload) ||
      (payload.rol !== RolUsuario.USER && payload.rol !== RolUsuario.ADMIN)
    ) {
      throw new UnauthorizedException('No autorizado');
    }
    const usuario = await this.usuarioRepository.findOne({ id: payload.sub });
    if (!usuario || usuario.activo !== true) {
      throw new UnauthorizedException('No autorizado');
    }
    request.user = usuarioPublico(usuario);
    return true;
  }
}

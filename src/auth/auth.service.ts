import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Usuario } from '../usuario/usuario.entity';
import { RolUsuario } from '../usuario/rol-usuario.enum';
import { PasswordService } from './password.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload, LoginResponse } from './auth.types';

export type UsuarioPublico = Pick<
  Usuario,
  'id' | 'nombre' | 'apellido' | 'email' | 'rol' | 'activo' | 'fechaCreacion'
>;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: EntityRepository<Usuario>,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<UsuarioPublico> {
    const email = dto.email.trim().toLowerCase();
    if (await this.usuarioRepository.findOne({ email })) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }
    const usuario = new Usuario();
    usuario.nombre = dto.nombre;
    usuario.apellido = dto.apellido;
    usuario.email = email;
    usuario.rol = RolUsuario.USER;
    usuario.activo = true;
    usuario.passwordHash = await this.passwordService.hash(dto.password);
    const em = this.usuarioRepository.getEntityManager();
    em.persist(usuario);
    try {
      await em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException('Ya existe un usuario con ese email');
      }
      throw error;
    }
    return this.usuarioPublico(usuario);
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const email = dto.email.trim().toLowerCase();
    const usuario = await this.usuarioRepository.findOne({ email });
    if (
      !usuario ||
      !usuario.activo ||
      !usuario.passwordHash ||
      !(await this.passwordService.compare(dto.password, usuario.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { user: this.usuarioPublico(usuario), accessToken };
  }

  private usuarioPublico(usuario: Usuario): UsuarioPublico {
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
}

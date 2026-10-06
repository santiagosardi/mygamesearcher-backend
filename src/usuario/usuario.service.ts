import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Usuario } from './usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: EntityRepository<Usuario>,
  ) {}

  findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.findAll();
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ id });
    if (!usuario) {
      throw new NotFoundException(`No se encontró el usuario con id ${id}`);
    }
    return usuario;
  }

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const email = dto.email.trim().toLowerCase();
    await this.verificarEmailDisponible(email);

    const usuario = new Usuario();
    usuario.nombre = dto.nombre;
    usuario.apellido = dto.apellido;
    usuario.email = email;

    const entityManager = this.usuarioRepository.getEntityManager();
    entityManager.persist(usuario);
    await this.guardarCambios();
    return usuario;
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.findOne(id);
    const email = dto.email?.trim().toLowerCase();
    if (email !== undefined) {
      await this.verificarEmailDisponible(email, id);
    }

    if (dto.nombre !== undefined) {
      usuario.nombre = dto.nombre;
    }
    if (dto.apellido !== undefined) {
      usuario.apellido = dto.apellido;
    }
    if (email !== undefined) {
      usuario.email = email;
    }

    await this.guardarCambios();
    return usuario;
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    const entityManager = this.usuarioRepository.getEntityManager();
    entityManager.remove(usuario);
    await entityManager.flush();
  }

  private async verificarEmailDisponible(
    email: string,
    usuarioId?: number,
  ): Promise<void> {
    const existente = await this.usuarioRepository.findOne({ email });
    if (existente && existente.id !== usuarioId) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }
  }

  private async guardarCambios(): Promise<void> {
    try {
      await this.usuarioRepository.getEntityManager().flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException('Ya existe un usuario con ese email');
      }
      throw error;
    }
  }
}

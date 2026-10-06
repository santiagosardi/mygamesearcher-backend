import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Biblioteca } from './biblioteca.entity';
import { Usuario } from '../usuario/usuario.entity';
import { Juego } from '../juego/juego.entity';
import { CreateBibliotecaDto } from './dto/create-biblioteca.dto';
import { UpdateBibliotecaDto } from './dto/update-biblioteca.dto';

@Injectable()
export class BibliotecaService {
  constructor(
    @InjectRepository(Biblioteca)
    private readonly bibliotecaRepository: EntityRepository<Biblioteca>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: EntityRepository<Usuario>,
    @InjectRepository(Juego)
    private readonly juegoRepository: EntityRepository<Juego>,
  ) {}

  findAll(usuarioId?: number): Promise<Biblioteca[]> {
    if (
      usuarioId !== undefined &&
      (!Number.isSafeInteger(usuarioId) || usuarioId <= 0)
    ) {
      throw new BadRequestException('usuarioId debe ser un entero positivo');
    }
    return this.bibliotecaRepository.find(
      usuarioId === undefined ? {} : { usuario: usuarioId },
      { populate: ['usuario', 'juego'] },
    );
  }

  async findOne(id: number): Promise<Biblioteca> {
    const biblioteca = await this.bibliotecaRepository.findOne(
      { id },
      { populate: ['usuario', 'juego'] },
    );
    if (!biblioteca) {
      throw new NotFoundException(
        `No se encontró la entrada de biblioteca con id ${id}`,
      );
    }
    return biblioteca;
  }

  async create(dto: CreateBibliotecaDto): Promise<Biblioteca> {
    const usuario = await this.usuarioRepository.findOne({ id: dto.usuarioId });
    if (!usuario) {
      throw new NotFoundException(
        `No se encontró el usuario con id ${dto.usuarioId}`,
      );
    }
    const juego = await this.juegoRepository.findOne({ id: dto.juegoId });
    if (!juego) {
      throw new NotFoundException(
        `No se encontró el juego con id ${dto.juegoId}`,
      );
    }
    const existente = await this.bibliotecaRepository.findOne({
      usuario,
      juego,
    });
    if (existente) {
      throw new ConflictException(
        'El juego ya está en la biblioteca de ese usuario',
      );
    }

    const biblioteca = new Biblioteca();
    biblioteca.usuario = usuario;
    biblioteca.juego = juego;
    if (dto.estado !== undefined) {
      biblioteca.estado = dto.estado;
    }
    if (dto.favorito !== undefined) {
      biblioteca.favorito = dto.favorito;
    }

    const entityManager = this.bibliotecaRepository.getEntityManager();
    entityManager.persist(biblioteca);
    try {
      await entityManager.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          'El juego ya está en la biblioteca de ese usuario',
        );
      }
      throw error;
    }
    return biblioteca;
  }

  async update(id: number, dto: UpdateBibliotecaDto): Promise<Biblioteca> {
    const biblioteca = await this.findOne(id);
    if (dto.estado !== undefined) {
      biblioteca.estado = dto.estado;
    }
    if (dto.favorito !== undefined) {
      biblioteca.favorito = dto.favorito;
    }
    await this.bibliotecaRepository.getEntityManager().flush();
    return biblioteca;
  }

  async remove(id: number): Promise<void> {
    const biblioteca = await this.findOne(id);
    const entityManager = this.bibliotecaRepository.getEntityManager();
    entityManager.remove(biblioteca);
    await entityManager.flush();
  }
}

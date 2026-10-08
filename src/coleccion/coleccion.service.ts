import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Coleccion } from './coleccion.entity';
import { Usuario } from '../usuario/usuario.entity';
import { Juego } from '../juego/juego.entity';
import { CreateColeccionDto } from './dto/create-coleccion.dto';
import { UpdateColeccionDto } from './dto/update-coleccion.dto';

@Injectable()
export class ColeccionService {
  constructor(
    @InjectRepository(Coleccion)
    private readonly coleccionRepository: EntityRepository<Coleccion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: EntityRepository<Usuario>,
    @InjectRepository(Juego)
    private readonly juegoRepository: EntityRepository<Juego>,
  ) {}

  findAll(usuarioId: number): Promise<Coleccion[]> {
    return this.coleccionRepository.find(
      { usuario: usuarioId },
      { populate: ['usuario', 'juegos'] },
    );
  }

  async findOne(id: number, usuarioId: number): Promise<Coleccion> {
    const coleccion = await this.coleccionRepository.findOne(
      { id, usuario: usuarioId },
      { populate: ['usuario', 'juegos'] },
    );
    if (!coleccion) {
      throw new NotFoundException(`No se encontró la colección con id ${id}`);
    }
    return coleccion;
  }

  async create(dto: CreateColeccionDto, usuarioId: number): Promise<Coleccion> {
    const usuario = await this.usuarioRepository.findOne({ id: usuarioId });
    if (!usuario) {
      throw new NotFoundException(
        `No se encontró el usuario con id ${usuarioId}`,
      );
    }
    const nombre = dto.nombre.trim();
    await this.verificarNombreDisponible(usuario.id, nombre);
    const juegos = await this.buscarJuegos(dto.juegoIds ?? []);

    const coleccion = new Coleccion();
    coleccion.nombre = nombre;
    coleccion.descripcion = dto.descripcion;
    coleccion.usuario = usuario;
    coleccion.juegos.add(juegos);

    this.coleccionRepository.getEntityManager().persist(coleccion);
    await this.guardarCambios();
    return coleccion;
  }

  async update(
    id: number,
    dto: UpdateColeccionDto,
    usuarioId: number,
  ): Promise<Coleccion> {
    const coleccion = await this.findOne(id, usuarioId);
    const nombre = dto.nombre?.trim();
    if (nombre !== undefined) {
      await this.verificarNombreDisponible(coleccion.usuario.id, nombre, id);
    }
    const juegos =
      dto.juegoIds === undefined
        ? undefined
        : await this.buscarJuegos(dto.juegoIds);

    if (nombre !== undefined) {
      coleccion.nombre = nombre;
    }
    if (dto.descripcion !== undefined) {
      coleccion.descripcion = dto.descripcion;
    }
    if (juegos !== undefined) {
      coleccion.juegos.set(juegos);
    }

    await this.guardarCambios();
    return coleccion;
  }

  async remove(id: number, usuarioId: number): Promise<void> {
    const coleccion = await this.findOne(id, usuarioId);
    const entityManager = this.coleccionRepository.getEntityManager();
    entityManager.remove(coleccion);
    await entityManager.flush();
  }

  private async buscarJuegos(ids: number[]): Promise<Juego[]> {
    if (ids.length === 0) {
      return [];
    }
    const juegos = await this.juegoRepository.find({ id: { $in: ids } });
    const encontrados = new Set(juegos.map((juego) => juego.id));
    const faltantes = ids.filter((id) => !encontrados.has(id));
    if (faltantes.length) {
      throw new BadRequestException(
        `No existen juegos con los ids: ${faltantes.join(', ')}`,
      );
    }
    return juegos;
  }

  private async verificarNombreDisponible(
    usuarioId: number,
    nombre: string,
    coleccionId?: number,
  ): Promise<void> {
    const existente = await this.coleccionRepository.findOne({
      usuario: usuarioId,
      nombre,
    });
    if (existente && existente.id !== coleccionId) {
      throw new ConflictException(
        'Ya existe una colección con ese nombre para este usuario',
      );
    }
  }

  private async guardarCambios(): Promise<void> {
    try {
      await this.coleccionRepository.getEntityManager().flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          'Ya existe una colección con ese nombre para este usuario',
        );
      }
      throw error;
    }
  }
}

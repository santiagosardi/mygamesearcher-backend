import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Genero } from './genero.entity';
import { CreateGeneroDto } from './dto/create-genero.dto';
import { UpdateGeneroDto } from './dto/update-genero.dto';

@Injectable()
export class GeneroService {
  constructor(
    @InjectRepository(Genero)
    private readonly generoRepository: EntityRepository<Genero>,
  ) {}

  findAll(): Promise<Genero[]> {
    return this.generoRepository.findAll();
  }

  async findOne(id: number): Promise<Genero> {
    const genero = await this.generoRepository.findOne({ id });

    if (!genero) {
      throw new NotFoundException(`No se encontró el género con id ${id}`);
    }

    return genero;
  }

  async create(createGeneroDto: CreateGeneroDto): Promise<Genero> {
    const generoExistente = await this.generoRepository.findOne({
      nombre: createGeneroDto.nombre,
    });

    if (generoExistente) {
      throw new ConflictException('Ya existe un género con ese nombre');
    }

    const genero = new Genero();
    genero.nombre = createGeneroDto.nombre;
    genero.descripcion = createGeneroDto.descripcion;

    const entityManager = this.generoRepository.getEntityManager();
    entityManager.persist(genero);
    await entityManager.flush();

    return genero;
  }

  async update(id: number, updateGeneroDto: UpdateGeneroDto): Promise<Genero> {
    const genero = await this.findOne(id);

    if (updateGeneroDto.nombre !== undefined) {
      genero.nombre = updateGeneroDto.nombre;
    }

    if (updateGeneroDto.descripcion !== undefined) {
      genero.descripcion = updateGeneroDto.descripcion;
    }

    await this.generoRepository.getEntityManager().flush();

    return genero;
  }

  async remove(id: number): Promise<void> {
    const genero = await this.findOne(id);
    const entityManager = this.generoRepository.getEntityManager();
    entityManager.remove(genero);
    await entityManager.flush();
  }
}

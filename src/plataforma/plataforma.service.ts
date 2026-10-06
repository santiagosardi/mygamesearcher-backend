import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Plataforma } from './plataforma.entity';
import { CreatePlataformaDto } from './dto/create-plataforma.dto';
import { UpdatePlataformaDto } from './dto/update-plataforma.dto';

@Injectable()
export class PlataformaService {
  constructor(
    @InjectRepository(Plataforma)
    private readonly plataformaRepository: EntityRepository<Plataforma>,
  ) {}

  findAll(): Promise<Plataforma[]> {
    return this.plataformaRepository.findAll();
  }

  async findOne(id: number): Promise<Plataforma> {
    const plataforma = await this.plataformaRepository.findOne({ id });

    if (!plataforma) {
      throw new NotFoundException(`No se encontró la plataforma con id ${id}`);
    }

    return plataforma;
  }

  async create(createPlataformaDto: CreatePlataformaDto): Promise<Plataforma> {
    const plataformaExistente = await this.plataformaRepository.findOne({
      nombre: createPlataformaDto.nombre,
    });

    if (plataformaExistente) {
      throw new ConflictException('Ya existe una plataforma con ese nombre');
    }

    const plataforma = new Plataforma();
    plataforma.nombre = createPlataformaDto.nombre;
    plataforma.descripcion = createPlataformaDto.descripcion;

    const entityManager = this.plataformaRepository.getEntityManager();
    entityManager.persist(plataforma);
    await entityManager.flush();

    return plataforma;
  }

  async update(
    id: number,
    updatePlataformaDto: UpdatePlataformaDto,
  ): Promise<Plataforma> {
    const plataforma = await this.findOne(id);

    if (updatePlataformaDto.nombre !== undefined) {
      plataforma.nombre = updatePlataformaDto.nombre;
    }

    if (updatePlataformaDto.descripcion !== undefined) {
      plataforma.descripcion = updatePlataformaDto.descripcion;
    }

    await this.plataformaRepository.getEntityManager().flush();

    return plataforma;
  }

  async remove(id: number): Promise<void> {
    const plataforma = await this.findOne(id);
    const entityManager = this.plataformaRepository.getEntityManager();
    entityManager.remove(plataforma);
    await entityManager.flush();
  }
}

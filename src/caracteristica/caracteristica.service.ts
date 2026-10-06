import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Caracteristica } from './caracteristica.entity';
import { CreateCaracteristicaDto } from './dto/create-caracteristica.dto';
import { UpdateCaracteristicaDto } from './dto/update-caracteristica.dto';

@Injectable()
export class CaracteristicaService {
  constructor(
    @InjectRepository(Caracteristica)
    private readonly caracteristicaRepository: EntityRepository<Caracteristica>,
  ) {}

  findAll(): Promise<Caracteristica[]> {
    return this.caracteristicaRepository.findAll();
  }

  async findOne(id: number): Promise<Caracteristica> {
    const caracteristica = await this.caracteristicaRepository.findOne({ id });

    if (!caracteristica) {
      throw new NotFoundException(
        `No se encontró la caracteristica con id ${id}`,
      );
    }

    return caracteristica;
  }

  async create(
    createCaracteristicaDto: CreateCaracteristicaDto,
  ): Promise<Caracteristica> {
    const caracteristicaExistente = await this.caracteristicaRepository.findOne(
      {
        nombre: createCaracteristicaDto.nombre,
      },
    );

    if (caracteristicaExistente) {
      throw new ConflictException(
        'Ya existe una caracteristica con ese nombre',
      );
    }

    const caracteristica = new Caracteristica();
    caracteristica.nombre = createCaracteristicaDto.nombre;
    caracteristica.descripcion = createCaracteristicaDto.descripcion;

    const entityManager = this.caracteristicaRepository.getEntityManager();
    entityManager.persist(caracteristica);
    await entityManager.flush();

    return caracteristica;
  }

  async update(
    id: number,
    updateCaracteristicaDto: UpdateCaracteristicaDto,
  ): Promise<Caracteristica> {
    const caracteristica = await this.findOne(id);

    if (updateCaracteristicaDto.nombre !== undefined) {
      caracteristica.nombre = updateCaracteristicaDto.nombre;
    }

    if (updateCaracteristicaDto.descripcion !== undefined) {
      caracteristica.descripcion = updateCaracteristicaDto.descripcion;
    }

    await this.caracteristicaRepository.getEntityManager().flush();

    return caracteristica;
  }

  async remove(id: number): Promise<void> {
    const caracteristica = await this.findOne(id);
    const entityManager = this.caracteristicaRepository.getEntityManager();
    entityManager.remove(caracteristica);
    await entityManager.flush();
  }
}

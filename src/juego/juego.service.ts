import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Juego } from './juego.entity';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { CreateJuegoDto } from './dto/create-juego.dto';
import { UpdateJuegoDto } from './dto/update-juego.dto';

@Injectable()
export class JuegoService {
  constructor(
    @InjectRepository(Juego)
    private readonly juegoRepository: EntityRepository<Juego>,
    @InjectRepository(Genero)
    private readonly generoRepository: EntityRepository<Genero>,
    @InjectRepository(Plataforma)
    private readonly plataformaRepository: EntityRepository<Plataforma>,
    @InjectRepository(Caracteristica)
    private readonly caracteristicaRepository: EntityRepository<Caracteristica>,
  ) {}

  findAll(): Promise<Juego[]> {
    return this.juegoRepository.findAll({
      populate: ['generos', 'plataformas', 'caracteristicas'],
    });
  }

  async findOne(id: number): Promise<Juego> {
    const juego = await this.juegoRepository.findOne(
      { id },
      { populate: ['generos', 'plataformas', 'caracteristicas'] },
    );

    if (!juego) {
      throw new NotFoundException(`No se encontró el juego con id ${id}`);
    }

    return juego;
  }

  async create(createJuegoDto: CreateJuegoDto): Promise<Juego> {
    const juego = new Juego();
    juego.titulo = createJuegoDto.titulo;
    juego.descripcion = createJuegoDto.descripcion;
    juego.fechaLanzamiento = createJuegoDto.fechaLanzamiento;
    juego.desarrollador = createJuegoDto.desarrollador;
    juego.urlImagen = createJuegoDto.urlImagen;

    if (createJuegoDto.generoIds?.length) {
      const generos = await this.generoRepository.find({
        id: { $in: createJuegoDto.generoIds },
      });
      this.validarIds(createJuegoDto.generoIds, generos, 'géneros');

      juego.generos.add(generos);
    }

    if (createJuegoDto.plataformaIds?.length) {
      const plataformas = await this.plataformaRepository.find({
        id: { $in: createJuegoDto.plataformaIds },
      });
      this.validarIds(createJuegoDto.plataformaIds, plataformas, 'plataformas');

      juego.plataformas.add(plataformas);
    }

    if (createJuegoDto.caracteristicaIds?.length) {
      const caracteristicas = await this.caracteristicaRepository.find({
        id: { $in: createJuegoDto.caracteristicaIds },
      });
      this.validarIds(
        createJuegoDto.caracteristicaIds,
        caracteristicas,
        'características',
      );

      juego.caracteristicas.add(caracteristicas);
    }

    const entityManager = this.juegoRepository.getEntityManager();
    entityManager.persist(juego);
    await entityManager.flush();

    return juego;
  }

  async update(id: number, updateJuegoDto: UpdateJuegoDto): Promise<Juego> {
    const juego = await this.findOne(id);
    let generos: Genero[] | undefined;
    let plataformas: Plataforma[] | undefined;
    let caracteristicas: Caracteristica[] | undefined;

    if (updateJuegoDto.generoIds !== undefined) {
      generos = updateJuegoDto.generoIds.length
        ? await this.generoRepository.find({
            id: { $in: updateJuegoDto.generoIds },
          })
        : [];
      this.validarIds(updateJuegoDto.generoIds, generos, 'géneros');
    }

    if (updateJuegoDto.plataformaIds !== undefined) {
      plataformas = updateJuegoDto.plataformaIds.length
        ? await this.plataformaRepository.find({
            id: { $in: updateJuegoDto.plataformaIds },
          })
        : [];
      this.validarIds(updateJuegoDto.plataformaIds, plataformas, 'plataformas');
    }

    if (updateJuegoDto.caracteristicaIds !== undefined) {
      caracteristicas = updateJuegoDto.caracteristicaIds.length
        ? await this.caracteristicaRepository.find({
            id: { $in: updateJuegoDto.caracteristicaIds },
          })
        : [];
      this.validarIds(
        updateJuegoDto.caracteristicaIds,
        caracteristicas,
        'características',
      );
    }

    if (updateJuegoDto.titulo !== undefined) {
      juego.titulo = updateJuegoDto.titulo;
    }
    if (updateJuegoDto.descripcion !== undefined) {
      juego.descripcion = updateJuegoDto.descripcion;
    }
    if (updateJuegoDto.fechaLanzamiento !== undefined) {
      juego.fechaLanzamiento = updateJuegoDto.fechaLanzamiento;
    }
    if (updateJuegoDto.desarrollador !== undefined) {
      juego.desarrollador = updateJuegoDto.desarrollador;
    }
    if (updateJuegoDto.urlImagen !== undefined) {
      juego.urlImagen = updateJuegoDto.urlImagen;
    }

    if (generos !== undefined) {
      juego.generos.set(generos);
    }
    if (plataformas !== undefined) {
      juego.plataformas.set(plataformas);
    }
    if (caracteristicas !== undefined) {
      juego.caracteristicas.set(caracteristicas);
    }

    await this.juegoRepository.getEntityManager().flush();
    return juego;
  }

  async remove(id: number): Promise<void> {
    const juego = await this.findOne(id);
    const entityManager = this.juegoRepository.getEntityManager();
    entityManager.remove(juego);
    await entityManager.flush();
  }

  private validarIds(
    ids: number[],
    entidades: { id: number }[],
    recurso: string,
  ): void {
    const idsEncontrados = new Set(entidades.map((entidad) => entidad.id));
    const idsInexistentes = ids.filter((id) => !idsEncontrados.has(id));

    if (idsInexistentes.length) {
      throw new BadRequestException(
        `No existen ${recurso} con los ids: ${idsInexistentes.join(', ')}`,
      );
    }
  }
}

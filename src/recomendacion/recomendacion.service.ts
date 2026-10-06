import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Usuario } from '../usuario/usuario.entity';
import { Juego } from '../juego/juego.entity';
import { Biblioteca } from '../biblioteca/biblioteca.entity';
import type {
  Recomendacion,
  RespuestaRecomendaciones,
} from './recomendacion.types';

@Injectable()
export class RecomendacionService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: EntityRepository<Usuario>,
    @InjectRepository(Biblioteca)
    private readonly bibliotecaRepository: EntityRepository<Biblioteca>,
    @InjectRepository(Juego)
    private readonly juegoRepository: EntityRepository<Juego>,
  ) {}

  async recomendar(usuarioId: number): Promise<RespuestaRecomendaciones> {
    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId debe ser un entero positivo');
    }
    const usuario = await this.usuarioRepository.findOne({ id: usuarioId });
    if (!usuario) {
      throw new NotFoundException(
        `No se encontró el usuario con id ${usuarioId}`,
      );
    }
    const biblioteca = await this.bibliotecaRepository.find(
      { usuario: usuarioId },
      {
        populate: [
          'juego.generos',
          'juego.plataformas',
          'juego.caracteristicas',
        ],
      },
    );
    if (biblioteca.length === 0) {
      return {
        usuarioId,
        recomendaciones: [],
        mensaje: 'No hay suficiente información: la biblioteca está vacía',
      };
    }

    const generos = new Map<number, number>();
    const caracteristicas = new Map<number, number>();
    const plataformas = new Map<number, number>();
    for (const entrada of biblioteca) {
      const peso = entrada.favorito ? 2 : 1;
      this.acumularPesos(generos, entrada.juego.generos, peso);
      this.acumularPesos(caracteristicas, entrada.juego.caracteristicas, peso);
      this.acumularPesos(plataformas, entrada.juego.plataformas, peso);
    }

    const candidatos = await this.juegoRepository.find(
      { id: { $nin: biblioteca.map((entrada) => entrada.juego.id) } },
      { populate: ['generos', 'plataformas', 'caracteristicas'] },
    );
    const recomendaciones: Recomendacion[] = [];
    for (const juego of candidatos) {
      const motivos: string[] = [];
      const puntaje =
        this.calcularAporte(juego.generos, generos, 3, 'género', motivos) +
        this.calcularAporte(
          juego.caracteristicas,
          caracteristicas,
          2,
          'característica',
          motivos,
        ) +
        this.calcularAporte(
          juego.plataformas,
          plataformas,
          1,
          'plataforma',
          motivos,
        );
      if (puntaje > 0) {
        recomendaciones.push({ juego, puntaje, motivos });
      }
    }
    recomendaciones.sort(
      (a, b) => b.puntaje - a.puntaje || a.juego.id - b.juego.id,
    );
    const resultado = recomendaciones.slice(0, 10);
    if (resultado.length === 0) {
      return {
        usuarioId,
        recomendaciones: [],
        mensaje:
          'No se encontraron recomendaciones con las preferencias actuales',
      };
    }
    return { usuarioId, recomendaciones: resultado };
  }

  private acumularPesos(
    mapa: Map<number, number>,
    atributos: Iterable<{ id: number }>,
    peso: number,
  ): void {
    for (const atributo of atributos) {
      mapa.set(atributo.id, (mapa.get(atributo.id) ?? 0) + peso);
    }
  }

  private calcularAporte(
    atributos: Iterable<{ id: number; nombre: string }>,
    preferencias: Map<number, number>,
    multiplicador: number,
    tipo: string,
    motivos: string[],
  ): number {
    let total = 0;
    const ordenados = [...atributos].sort((a, b) => a.id - b.id);
    for (const atributo of ordenados) {
      const aporte = multiplicador * (preferencias.get(atributo.id) ?? 0);
      if (aporte > 0) {
        total += aporte;
        motivos.push(`Comparte ${tipo} ${atributo.nombre}: +${aporte}`);
      }
    }
    return total;
  }
}

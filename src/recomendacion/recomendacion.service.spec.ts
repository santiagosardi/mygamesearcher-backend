import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Collection } from '@mikro-orm/core';
import { Usuario } from '../usuario/usuario.entity';
import { Juego } from '../juego/juego.entity';
import { Biblioteca } from '../biblioteca/biblioteca.entity';
import { RecomendacionService } from './recomendacion.service';

function crearJuego(id: number, relacionado = true): Juego {
  const juego = new Juego();
  juego.id = id;
  juego.titulo = `Juego ${id}`;
  if (relacionado) {
    juego.generos = new Collection(juego, [{ id: 1, nombre: 'RPG' }]);
    juego.caracteristicas = new Collection(juego, [
      { id: 1, nombre: 'Mundo abierto' },
    ]);
    juego.plataformas = new Collection(juego, [{ id: 1, nombre: 'PC' }]);
  }
  return juego;
}

function crearEntrada(juego: Juego, favorito: boolean): Biblioteca {
  const entrada = new Biblioteca();
  entrada.juego = juego;
  entrada.favorito = favorito;
  return entrada;
}

describe('RecomendacionService', () => {
  let service: RecomendacionService;
  let usuarioRepository: {
    findOne: jest.Mock<Promise<Usuario | null>, [unknown]>;
  };
  let bibliotecaRepository: {
    find: jest.Mock<Promise<Biblioteca[]>, [unknown, unknown]>;
  };
  let juegoRepository: {
    find: jest.Mock<Promise<Juego[]>, [unknown, unknown]>;
  };

  beforeEach(async () => {
    usuarioRepository = {
      findOne: jest
        .fn<Promise<Usuario | null>, [unknown]>()
        .mockResolvedValue(new Usuario()),
    };
    bibliotecaRepository = {
      find: jest.fn<Promise<Biblioteca[]>, [unknown, unknown]>(),
    };
    juegoRepository = {
      find: jest.fn<Promise<Juego[]>, [unknown, unknown]>(),
    };
    const module = await Test.createTestingModule({
      providers: [
        RecomendacionService,
        { provide: getRepositoryToken(Usuario), useValue: usuarioRepository },
        {
          provide: getRepositoryToken(Biblioteca),
          useValue: bibliotecaRepository,
        },
        { provide: getRepositoryToken(Juego), useValue: juegoRepository },
      ],
    }).compile();
    service = module.get(RecomendacionService);
  });

  it.each([0, -1, 1.5, NaN])('rechaza usuarioId inválido: %s', async (id) => {
    await expect(service.recomendar(id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usuarioRepository.findOne).not.toHaveBeenCalled();
  });

  it('devuelve 404 si el usuario no existe', async () => {
    usuarioRepository.findOne.mockResolvedValue(null);
    await expect(service.recomendar(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(bibliotecaRepository.find).not.toHaveBeenCalled();
  });

  it('devuelve una lista vacía sin consultar candidatos si no hay biblioteca', async () => {
    bibliotecaRepository.find.mockResolvedValue([]);
    const respuesta = await service.recomendar(1);
    expect(respuesta.recomendaciones).toEqual([]);
    expect(respuesta.mensaje).toContain('biblioteca está vacía');
    expect(juegoRepository.find).not.toHaveBeenCalled();
  });

  it('acumula favoritos y referencias normales y excluye juegos de biblioteca', async () => {
    bibliotecaRepository.find.mockResolvedValue([
      crearEntrada(crearJuego(1), true),
      crearEntrada(crearJuego(2), false),
    ]);
    const candidato = crearJuego(3);
    juegoRepository.find.mockResolvedValue([candidato, crearJuego(4, false)]);

    const respuesta = await service.recomendar(1);

    expect(respuesta.recomendaciones).toEqual([
      {
        juego: candidato,
        puntaje: 18,
        motivos: [
          'Comparte género RPG: +9',
          'Comparte característica Mundo abierto: +6',
          'Comparte plataforma PC: +3',
        ],
      },
    ]);
    expect(juegoRepository.find).toHaveBeenCalledWith(
      { id: { $nin: [1, 2] } },
      { populate: ['generos', 'plataformas', 'caracteristicas'] },
    );
    expect(bibliotecaRepository.find).toHaveBeenCalledWith(
      { usuario: 1 },
      {
        populate: [
          'juego.generos',
          'juego.plataformas',
          'juego.caracteristicas',
        ],
      },
    );
  });

  it('ordena por puntaje, desempata por id y limita a diez resultados', async () => {
    bibliotecaRepository.find.mockResolvedValue([
      crearEntrada(crearJuego(1), false),
    ]);
    const candidatos = Array.from({ length: 12 }, (_, index) =>
      crearJuego(20 - index),
    );
    const mayorPuntaje = crearJuego(99);
    mayorPuntaje.generos = new Collection(mayorPuntaje, [
      { id: 1, nombre: 'RPG' },
      { id: 2, nombre: 'Accion' },
    ]);
    const referencia = crearJuego(2, false);
    referencia.generos = new Collection(referencia, [
      { id: 2, nombre: 'Accion' },
    ]);
    bibliotecaRepository.find.mockResolvedValue([
      crearEntrada(crearJuego(1), false),
      crearEntrada(referencia, false),
    ]);
    juegoRepository.find.mockResolvedValue([...candidatos, mayorPuntaje]);
    const respuesta = await service.recomendar(1);
    expect(respuesta.recomendaciones.map((item) => item.juego.id)).toEqual([
      99, 9, 10, 11, 12, 13, 14, 15, 16, 17,
    ]);
  });

  it('informa cuando no hay candidatos con puntaje positivo', async () => {
    bibliotecaRepository.find.mockResolvedValue([
      crearEntrada(crearJuego(1), false),
    ]);
    juegoRepository.find.mockResolvedValue([crearJuego(2, false)]);
    await expect(service.recomendar(1)).resolves.toEqual({
      usuarioId: 1,
      recomendaciones: [],
      mensaje:
        'No se encontraron recomendaciones con las preferencias actuales',
    });
  });
});

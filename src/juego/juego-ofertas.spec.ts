import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Juego } from './juego.entity';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { JuegoService } from './juego.service';
import { JuegoController } from './juego.controller';

describe('Ofertas externas de Juego', () => {
  let service: JuegoService;
  let controller: JuegoController;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  const repository = { findOne: jest.fn() };
  const oferta = {
    gameID: '1',
    external: 'Juego de ejemplo',
    cheapest: '9.99',
    cheapestDealID: 'deal+/=',
    steamAppID: '12345',
    thumb: 'https://example.com/imagen.jpg',
  };

  beforeEach(async () => {
    repository.findOne.mockReset();
    repository.findOne.mockResolvedValue(
      Object.assign(new Juego(), { id: 32, titulo: 'Juego & ejemplo' }),
    );
    fetchMock = jest.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValue(new Response(JSON.stringify([oferta])));
    const module = await Test.createTestingModule({
      providers: [
        JuegoService,
        { provide: getRepositoryToken(Juego), useValue: repository },
        ...[Genero, Plataforma, Caracteristica].map((entity) => ({
          provide: getRepositoryToken(entity),
          useValue: {},
        })),
      ],
    }).compile();
    service = module.get(JuegoService);
    controller = new JuegoController(service);
  });

  afterEach(() => jest.restoreAllMocks());

  it('consulta por título local y adapta precio y enlaces sin exponer toda la respuesta', async () => {
    await expect(controller.findOfertas(32)).resolves.toEqual({
      disponible: true,
      fuente: 'CheapShark',
      titulo: oferta.external,
      precioMasBajoUSD: '9.99',
      steamAppId: '12345',
      imagen: oferta.thumb,
      urlOferta: 'https://www.cheapshark.com/redirect?dealID=deal%2B%2F%3D',
      urlSteam: 'https://store.steampowered.com/app/12345',
    });
    expect(repository.findOne).toHaveBeenCalledWith(
      { id: 32 },
      { populate: ['generos', 'plataformas', 'caracteristicas'] },
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    if (!(url instanceof URL)) throw new Error('Se esperaba una URL');
    expect(url.toString()).toBe(
      'https://www.cheapshark.com/api/1.0/games?title=Juego+%26+ejemplo&exact=1&limit=1',
    );
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(options?.headers).toEqual({
      'User-Agent': 'MyGameSearcher/1.0',
    });
  });

  it.each([null, '', undefined])(
    'admite steamAppID ausente: %p',
    async (steamAppID) => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify([{ ...oferta, steamAppID }])),
      );
      await expect(service.findOfertas(32)).resolves.toMatchObject({
        disponible: true,
        steamAppId: null,
        urlSteam: null,
      });
    },
  );

  it('devuelve un resultado controlado sin coincidencias', async () => {
    fetchMock.mockResolvedValue(new Response('[]'));
    await expect(service.findOfertas(32)).resolves.toEqual({
      disponible: false,
      fuente: 'CheapShark',
      mensaje: 'No se encontraron ofertas externas para este juego.',
    });
  });

  it('conserva el 404 local y no consulta CheapShark', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findOfertas(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([429, 500, 503])(
    'convierte HTTP %i externo a 502',
    async (status) => {
      fetchMock.mockResolvedValue(new Response('', { status }));
      await expect(service.findOfertas(32)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    },
  );

  it.each(['Error de red sensible', 'TimeoutError'])(
    'controla el fallo %s sin exponer detalles',
    async (message) => {
      fetchMock.mockRejectedValue(new Error(message));
      await expect(service.findOfertas(32)).rejects.toMatchObject({
        status: 502,
        message: 'No se pudieron consultar las ofertas externas.',
      });
    },
  );

  it.each(['{', '{}', '[{}]'])(
    'rechaza respuesta externa inválida %s',
    async (body) => {
      fetchMock.mockResolvedValue(new Response(body));
      await expect(service.findOfertas(32)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    },
  );
});

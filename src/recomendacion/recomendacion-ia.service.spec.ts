import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Collection } from '@mikro-orm/core';
import { RecomendacionIaService } from './recomendacion-ia.service';
import { RecomendacionService } from './recomendacion.service';
import { RecomendacionController } from './recomendacion.controller';
import { RecomendacionIaDto } from './dto/recomendacion-ia.dto';
import { Biblioteca } from '../biblioteca/biblioteca.entity';
import { Coleccion } from '../coleccion/coleccion.entity';
import { Juego } from '../juego/juego.entity';
import { Usuario } from '../usuario/usuario.entity';
import { EstadoBiblioteca } from '../biblioteca/estado-biblioteca.enum';
import { RolUsuario } from '../usuario/rol-usuario.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

function juego(id: number): Juego {
  return Object.assign(new Juego(), {
    id,
    titulo: 'Juego ' + id,
    descripcion: 'Aventura narrativa',
    desarrollador: 'Estudio',
    fechaLanzamiento: '2024-01-01',
  });
}

function respuesta(text: string): Response {
  return new Response(
    JSON.stringify({
      candidates: [{ finishReason: 'STOP', content: { parts: [{ text }] } }],
    }),
  );
}

describe('RecomendacionIaService', () => {
  let service: RecomendacionIaService;
  let warn: jest.SpyInstance;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  const base = { recomendar: jest.fn() };
  const config = { get: jest.fn() };
  const biblioteca = { find: jest.fn() };
  const coleccion = { findOne: jest.fn() };
  const candidatos = [juego(11), juego(12), juego(13), juego(14)];
  const items = candidatos.slice(0, 3).map((item) => ({
    juegoId: item.id,
    motivo: 'Su exploración pausada encaja con tus aventuras favoritas.',
  }));

  beforeEach(async () => {
    jest.resetAllMocks();
    warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    base.recomendar.mockResolvedValue({
      usuarioId: 8,
      recomendaciones: candidatos.map((item) => ({
        juego: item,
        puntaje: 6,
        motivos: [],
      })),
    });
    config.get.mockReturnValue('clave-ficticia-test');
    biblioteca.find.mockResolvedValue([
      Object.assign(new Biblioteca(), {
        juego: juego(1),
        favorito: true,
        estado: EstadoBiblioteca.COMPLETADO,
        usuario: Object.assign(new Usuario(), {
          id: 8,
          email: 'privado@example.test',
          passwordHash: 'hash-privado',
        }),
      }),
    ]);
    const fuente = Object.assign(new Coleccion(), {
      nombre: 'Historias',
      descripcion: 'Narrativa',
      usuario: Object.assign(new Usuario(), { id: 8 }),
    });
    fuente.juegos = new Collection(fuente, [juego(2)]);
    coleccion.findOne.mockResolvedValue(fuente);
    fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(respuesta(JSON.stringify({ recomendaciones: items })));
    const module = await Test.createTestingModule({
      providers: [
        RecomendacionIaService,
        { provide: RecomendacionService, useValue: base },
        { provide: ConfigService, useValue: config },
        { provide: getRepositoryToken(Biblioteca), useValue: biblioteca },
        { provide: getRepositoryToken(Coleccion), useValue: coleccion },
      ],
    }).compile();
    service = module.get(RecomendacionIaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('usa Biblioteca, candidatos determinísticos y devuelve tres entidades reales', async () => {
    const result = await service.recomendar(8);
    expect(base.recomendar).toHaveBeenCalledWith(8, undefined);
    expect(result.recomendaciones).toHaveLength(3);
    expect(result.recomendaciones[0].juego).toBe(candidatos[0]);
    expect(coleccion.findOne).not.toHaveBeenCalled();
    expect(biblioteca.find).toHaveBeenCalledWith(
      { usuario: 8 },
      {
        populate: [
          'juego.generos',
          'juego.plataformas',
          'juego.caracteristicas',
        ],
      },
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
    );
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'x-goog-api-key': 'clave-ficticia-test',
    });
    const body = options?.body;
    if (typeof body !== 'string') throw new Error('Se esperaba body JSON');
    const request = JSON.parse(body) as {
      contents: { parts: { text: string }[] }[];
      generationConfig: { responseMimeType: string };
    };
    const contexto = JSON.parse(request.contents[0].parts[0].text) as {
      referencias: { juegoId: number; favorito: boolean; estado: string }[];
      candidatos: { juegoId: number }[];
    };
    expect(contexto.referencias[0]).toMatchObject({
      juegoId: 1,
      favorito: true,
      estado: 'COMPLETADO',
    });
    expect(contexto.candidatos.map((item) => item.juegoId)).toEqual([
      11, 12, 13, 14,
    ]);
    expect(request.generationConfig.responseMimeType).toBe('application/json');
    for (const privado of [
      'usuarioId',
      'email',
      'passwordHash',
      'privado@example.test',
      'hash-privado',
      'clave-ficticia-test',
    ]) {
      expect(body).not.toContain(privado);
    }
  });

  it('usa solo la colección propia como fuente', async () => {
    await service.recomendar(8, 73);
    expect(base.recomendar).toHaveBeenCalledWith(8, 73);
    expect(coleccion.findOne).toHaveBeenCalledWith(
      { id: 73, usuario: 8 },
      {
        populate: [
          'juegos.generos',
          'juegos.plataformas',
          'juegos.caracteristicas',
        ],
      },
    );
    const body = fetchMock.mock.calls[0][1]?.body;
    if (typeof body !== 'string') throw new Error('Se esperaba body JSON');
    const request = JSON.parse(body) as {
      contents: { parts: { text: string }[] }[];
    };
    const contexto = JSON.parse(request.contents[0].parts[0].text) as {
      referencias: { juegoId: number }[];
      coleccion: { nombre: string };
    };
    expect(contexto.referencias.map((item) => item.juegoId)).toEqual([2]);
    expect(contexto.coleccion.nombre).toBe('Historias');
  });

  it.each([
    'No hay suficiente información: la biblioteca está vacía',
    'La colección está vacía',
    'No se encontraron recomendaciones con las preferencias actuales',
  ])('no llama a Gemini sin candidatos: %s', async (mensaje) => {
    base.recomendar.mockResolvedValue({
      usuarioId: 8,
      recomendaciones: [],
      mensaje,
    });
    config.get.mockReturnValue(undefined);
    await expect(service.recomendar(8)).resolves.toEqual({
      recomendaciones: [],
      mensaje,
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(biblioteca.find).not.toHaveBeenCalled();
  });

  it.each([new BadRequestException(), new NotFoundException()])(
    'propaga validación/ownership determinístico sin llamar al proveedor: %p',
    async (error) => {
      base.recomendar.mockRejectedValue(error);
      await expect(service.recomendar(8, 73)).rejects.toBe(error);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('revalida ownership al cargar contexto', async () => {
    coleccion.findOne.mockResolvedValue(null);
    await expect(service.recomendar(8, 73)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no llama al proveedor si la fuente quedó vacía entre consultas', async () => {
    biblioteca.find.mockResolvedValue([]);
    await expect(service.recomendar(8)).resolves.toMatchObject({
      recomendaciones: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignora IDs ajenos, duplicados y títulos inventados y limita a tres', async () => {
    fetchMock.mockResolvedValue(
      respuesta(
        JSON.stringify({
          recomendaciones: [
            { juegoId: 999, motivo: 'Ajeno' },
            { juegoId: 11, motivo: 'Válido', titulo: 'Título inventado' },
            { juegoId: 11, motivo: 'Duplicado' },
            ...items.slice(1),
            { juegoId: 14, motivo: 'Cuarto' },
          ],
        }),
      ),
    );
    const result = await service.recomendar(8);
    expect(result.recomendaciones.map((item) => item.juego.id)).toEqual([
      11, 12, 13,
    ]);
    expect(result.recomendaciones[0].juego.titulo).toBe('Juego 11');
    expect(result.recomendaciones[0]).not.toHaveProperty('puntaje');
  });

  it.each([
    '{',
    '{}',
    '{"recomendaciones":[]}',
    '{"recomendaciones":[{"juegoId":999,"motivo":"Ajeno"}]}',
    '{"recomendaciones":[{"juegoId":11,"motivo":""}]}',
    '{"recomendaciones":[{"juegoId":"11","motivo":"Tipo inválido"}]}',
  ])('rechaza JSON o resultado inválido: %s', async (text) => {
    fetchMock.mockResolvedValue(respuesta(text));
    await expect(service.recomendar(8)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('rechaza respuestas bloqueadas o sin contenido', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }),
      ),
    );
    await expect(service.recomendar(8)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it.each([429, 500, 403])(
    'controla HTTP %i sin reintentos',
    async (status) => {
      fetchMock.mockResolvedValue(new Response('detalle privado', { status }));
      await expect(service.recomendar(8)).rejects.toMatchObject({
        status: 502,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls).toEqual([['Gemini: HTTP ' + status]]);
    },
  );

  it('controla errores de red sin exponer información del proveedor', async () => {
    fetchMock.mockRejectedValue(new Error('clave sensible'));
    await expect(service.recomendar(8)).rejects.toMatchObject({
      status: 502,
      message:
        'No se pudieron obtener recomendaciones válidas del servicio de IA.',
    });
  });

  it.each([
    {
      body: '{contenido privado',
      esperado: 'Gemini: error de parseo JSON (json)',
    },
    {
      body: JSON.stringify({
        candidates: [
          {
            finishReason: 'STOP',
            content: { parts: [{ text: '{contenido privado' }] },
          },
        ],
      }),
      esperado: 'Gemini: error de parseo JSON (validacion)',
    },
    {
      body: JSON.stringify({
        candidates: [
          {
            finishReason: 'STOP',
            content: { parts: [{ text: '{"recomendaciones":[]}' }] },
          },
        ],
      }),
      esperado: 'Gemini: sin recomendaciones válidas',
    },
    {
      body: JSON.stringify({ candidates: [{ finishReason: 'MAX_TOKENS' }] }),
      esperado: 'Gemini: finishReason=MAX_TOKENS',
    },
    {
      body: JSON.stringify({
        candidates: [{ finishReason: 'email@example.test clave sensible' }],
      }),
      esperado: 'Gemini: finishReason=DESCONOCIDO_O_AUSENTE',
    },
  ])('registra diagnóstico seguro: $esperado', async ({ body, esperado }) => {
    fetchMock.mockResolvedValue(new Response(body));
    await expect(service.recomendar(8)).rejects.toMatchObject({
      status: 502,
      message:
        'No se pudieron obtener recomendaciones válidas del servicio de IA.',
    });
    expect(warn).toHaveBeenCalledWith(esperado);
    const logs = JSON.stringify(warn.mock.calls);
    for (const secreto of [
      'contenido privado',
      'email@example.test',
      'clave sensible',
      'clave-ficticia-test',
      'hash-privado',
    ]) {
      expect(logs).not.toContain(secreto);
    }
  });

  it('registra error de red sin registrar el error original', async () => {
    fetchMock.mockRejectedValue(new Error('API_KEY=secreto JWT=privado'));
    await expect(service.recomendar(8)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(warn.mock.calls).toEqual([
      ['Gemini: error de red/lectura de respuesta'],
    ]);
  });

  it('aborta a los 45 segundos, nunca antes, sin reintentos', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => reject(new Error('abortado')),
            { once: true },
          );
        }),
    );
    const pending = expect(service.recomendar(8)).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
    await jest.advanceTimersByTimeAsync(44999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const signal = fetchMock.mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    expect(signal?.aborted).toBe(true);
    await pending;
    expect(warn.mock.calls).toEqual([['Gemini: timeout']]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falta de clave falla solo al ejecutar IA con candidatos', async () => {
    config.get.mockReturnValue(undefined);
    await expect(service.recomendar(8)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Contrato POST recomendaciones/ia', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it.each([{}, { coleccionId: 73 }])('acepta %p', async (body) => {
    await expect(
      pipe.transform(body, { type: 'body', metatype: RecomendacionIaDto }),
    ).resolves.toEqual(body);
  });

  it.each([
    { usuarioId: 8 },
    { coleccionId: -1 },
    { coleccionId: 0 },
    { coleccionId: 1.5 },
    { coleccionId: null },
    { coleccionId: '73' },
  ])('rechaza %p', async (body) => {
    await expect(
      pipe.transform(body, { type: 'body', metatype: RecomendacionIaDto }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('usa la identidad autenticada y conserva el guard y HTTP 200', async () => {
    const ia = {
      recomendar: jest.fn().mockResolvedValue({ recomendaciones: [] }),
    };
    const normal = { recomendar: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [RecomendacionController],
      providers: [
        { provide: RecomendacionIaService, useValue: ia },
        { provide: RecomendacionService, useValue: normal },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    const controller = module.get(RecomendacionController);
    const user = Object.assign(new Usuario(), { id: 8, rol: RolUsuario.USER });
    await expect(
      controller.recomendarIa(user, { coleccionId: 73 }),
    ).resolves.toEqual({ recomendaciones: [] });
    expect(ia.recomendar).toHaveBeenCalledWith(8, 73);
    expect(normal.recomendar).not.toHaveBeenCalled();
    expect(
      Reflect.getMetadata('__guards__', RecomendacionController),
    ).toContain(JwtAuthGuard);
    expect(
      Reflect.getMetadata(
        '__httpCode__',
        Object.getOwnPropertyDescriptor(
          RecomendacionController.prototype,
          'recomendarIa',
        )?.value as object,
      ),
    ).toBe(200);
  });
});

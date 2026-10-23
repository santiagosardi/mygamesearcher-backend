import { MikroORM, type EntityManager } from '@mikro-orm/mysql';
import config from '../mikro-orm.config';
import { Juego } from '../juego/juego.entity';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { CARACTERISTICAS, CATALOGO, GENEROS, PLATAFORMAS } from './catalogo';
import { seedCatalogo } from './seed-catalogo';

type Atributo = Genero | Plataforma | Caracteristica;

function crearAlmacen() {
  const juegos: Juego[] = [];
  const atributos: Atributo[] = [];
  const tx = {
    findOne: jest.fn(
      (entidad: new () => Atributo, filtro: { nombre: string }) =>
        Promise.resolve(
          atributos.find(
            (a) => a instanceof entidad && a.nombre === filtro.nombre,
          ) ?? null,
        ),
    ),
    find: jest.fn((_entidad: typeof Juego, filtro: { titulo: string }) =>
      Promise.resolve(juegos.filter((j) => j.titulo === filtro.titulo)),
    ),
    persist: jest.fn((entidad: Juego | Atributo) => {
      if (entidad instanceof Juego) {
        if (!juegos.includes(entidad)) {
          entidad.id = juegos.length + 100;
          juegos.push(entidad);
        }
      } else if (!atributos.includes(entidad)) {
        entidad.id = atributos.length + 100;
        atributos.push(entidad);
      }
    }),
    flush: jest.fn(() => Promise.resolve()),
  };
  const em = {
    transactional: jest.fn((fn: (manager: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  } as unknown as EntityManager;
  return { em, tx, juegos, atributos };
}

describe('Seed del catálogo (sin MySQL)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    // Collection.add necesita metadatos reales, sin abrir una conexión.
    orm = await MikroORM.init({ ...config, connect: false });
  });

  afterAll(async () => {
    await orm?.close(true);
  });

  it('incluye 347 títulos distintos y clasificaciones válidas y variadas', () => {
    expect(CATALOGO).toHaveLength(347);
    expect(new Set(CATALOGO.map((j) => j.titulo)).size).toBe(CATALOGO.length);
    for (const [campo, permitidos] of [
      ['generos', GENEROS],
      ['plataformas', PLATAFORMAS],
      ['caracteristicas', CARACTERISTICAS],
    ] as const) {
      const usados = new Set(CATALOGO.flatMap((j) => j[campo]));
      expect([...usados].sort()).toEqual([...permitidos].sort());
      for (const juego of CATALOGO) {
        expect(juego[campo].length).toBeGreaterThan(0);
        expect(new Set(juego[campo]).size).toBe(juego[campo].length);
      }
    }
    for (const juego of CATALOGO) {
      expect(juego.titulo.length).toBeLessThanOrEqual(255);
      expect(juego.descripcion.length).toBeGreaterThan(0);
    }
  });

  it('carga las 327 portadas de Steam y conserva los 20 juegos originales sin portada', async () => {
    const conPortada = CATALOGO.filter((juego) => juego.urlImagen);
    expect(conPortada).toHaveLength(327);
    for (const juego of conPortada) {
      expect(juego.urlImagen).toMatch(
        /^https:\/\/cdn\.cloudflare\.steamstatic\.com\/steam\/apps\/\d+\/header\.jpg$/,
      );
    }
    expect(
      CATALOGO.filter((juego) => !juego.urlImagen)
        .map((juego) => juego.titulo)
        .sort(),
    ).toEqual(
      [
        'Valorant',
        'Fortnite',
        'Minecraft',
        'Gran Turismo 7',
        "Uncharted 4: A Thief's End",
        'Uncharted: The Lost Legacy',
        'Resident Evil Requiem',
        'Kingdom Hearts III',
        "Marvel's Wolverine",
        'Diablo II: Resurrected',
        'Call of Duty: Black Ops 6',
        'World War Z: Aftermath',
        'YAPYAP',
        'The Legend of Zelda: Breath of the Wild',
        'The Legend of Zelda: Tears of the Kingdom',
        'Super Mario Party Jamboree',
        'Super Mario Bros. Wonder',
        'Super Mario Odyssey',
        'Shadow of the Colossus (2018)',
        'Jak and Daxter: The Precursor Legacy',
      ].sort(),
    );
    expect(
      CATALOGO.find((juego) => juego.titulo === 'God of War Ragnarök')
        ?.urlImagen,
    ).toBe(
      'https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/header.jpg',
    );

    const almacen = crearAlmacen();
    await seedCatalogo(almacen.em);
    for (const datos of CATALOGO) {
      expect(
        almacen.juegos.find((juego) => juego.titulo === datos.titulo)
          ?.urlImagen,
      ).toBe(datos.urlImagen);
    }
  });

  it('agrega exactamente 200 juegos con desarrollador y fecha válida sin exigirlos a los 147 originales', () => {
    const nuevos = CATALOGO.slice(147);
    expect(nuevos).toHaveLength(200);
    for (const juego of nuevos) {
      expect(juego.desarrollador?.trim().length).toBeGreaterThan(0);
      expect(juego.desarrollador!.length).toBeLessThanOrEqual(255);
      expect(juego.fechaLanzamiento).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
      expect(new Date(juego.fechaLanzamiento!).toISOString().slice(0, 10)).toBe(
        juego.fechaLanzamiento,
      );
      expect(juego.urlImagen).toBeDefined();
    }
  });

  it('no repite títulos, ediciones equivalentes ni las exclusiones de producción en la ampliación', () => {
    const normalizar = (titulo: string) =>
      titulo
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/^1\s+/, '')
        .replace(
          /\b(pixel remaster|hd remaster|remastered|remaster|definitive edition|enhanced edition|complete edition|game of the year edition|goty edition)\b/g,
          '',
        )
        .replace(/[^a-z0-9]/g, '');
    const prohibidos = new Set(
      [
        ...CATALOGO.slice(0, 147).map((juego) => juego.titulo),
        'DOOM (2016)',
        '1 DOOM',
        '1 DOOM Eternal',
        'Hollow Knight: Silksong',
        '!',
      ].map(normalizar),
    );
    const nuevos = CATALOGO.slice(147).map((juego) => normalizar(juego.titulo));
    expect(new Set(nuevos).size).toBe(200);
    for (const titulo of nuevos) {
      expect(prohibidos.has(titulo)).toBe(false);
    }
    const portadas = CATALOGO.filter((juego) => juego.urlImagen).map(
      (juego) => juego.urlImagen,
    );
    expect(new Set(portadas).size).toBe(portadas.length);
  });

  it('completa los metadatos de un juego de la ampliación sin sobrescribir valores existentes', async () => {
    const datos = CATALOGO[147];
    const almacen = crearAlmacen();
    const juego = new Juego();
    juego.titulo = datos.titulo;
    almacen.juegos.push(juego);
    await seedCatalogo(almacen.em);
    expect(juego.desarrollador).toBe(datos.desarrollador);
    expect(juego.fechaLanzamiento).toBe(datos.fechaLanzamiento);
    juego.desarrollador = 'Desarrollador existente';
    juego.fechaLanzamiento = '2000-01-01';
    await seedCatalogo(almacen.em);
    expect(juego.desarrollador).toBe('Desarrollador existente');
    expect(juego.fechaLanzamiento).toBe('2000-01-01');
  });
  it('reutiliza los registros y no duplica relaciones en dos cargas consecutivas', async () => {
    const almacen = crearAlmacen();
    const primera = await seedCatalogo(almacen.em);
    const relaciones = almacen.juegos.map((j) => [
      j.generos.length,
      j.plataformas.length,
      j.caracteristicas.length,
    ]);
    const segunda = await seedCatalogo(almacen.em);
    expect(primera.juegosCreados).toBe(CATALOGO.length);
    expect(segunda.juegosCreados).toBe(0);
    expect(segunda.juegosActualizadosOReutilizados).toBe(CATALOGO.length);
    expect(almacen.juegos).toHaveLength(CATALOGO.length);
    expect(almacen.atributos).toHaveLength(
      GENEROS.length + PLATAFORMAS.length + CARACTERISTICAS.length,
    );
    expect(
      almacen.juegos.map((j) => [
        j.generos.length,
        j.plataformas.length,
        j.caracteristicas.length,
      ]),
    ).toEqual(relaciones);
    expect(almacen.tx.flush).toHaveBeenCalledTimes(2);
  });

  it('conserva IDs, metadatos opcionales y relaciones previas de los juegos existentes', async () => {
    const almacen = crearAlmacen();
    const adicional = new Caracteristica();
    adicional.id = 77;
    adicional.nombre = 'Clasificación personalizada';
    almacen.atributos.push(adicional);
    const originales = ['Elden Ring', 'The Witcher 3'].map((titulo, index) => {
      const juego = new Juego();
      juego.id = index + 2;
      juego.titulo = titulo;
      juego.fechaLanzamiento = '2022-02-25';
      juego.desarrollador = 'Valor existente';
      juego.urlImagen = 'https://example.com/imagen.png';
      juego.caracteristicas.add(adicional);
      almacen.juegos.push(juego);
      return juego;
    });
    const resultado = await seedCatalogo(almacen.em);
    expect(resultado.juegosCreados).toBe(CATALOGO.length - originales.length);
    expect(resultado.juegosActualizadosOReutilizados).toBe(originales.length);
    for (const [index, juego] of originales.entries()) {
      expect(juego.id).toBe(index + 2);
      expect(almacen.juegos[index]).toBe(juego);
      expect(juego.fechaLanzamiento).toBe('2022-02-25');
      expect(juego.desarrollador).toBe('Valor existente');
      expect(juego.urlImagen).toBe('https://example.com/imagen.png');
      expect(juego.caracteristicas.contains(adicional)).toBe(true);
      expect(juego.generos.getItems().some((g) => g.nombre === 'RPG')).toBe(
        true,
      );
    }
  });

  it('carga desarrollador y fecha de lanzamiento desde el catálogo', async () => {
    const original = CATALOGO[0];

    CATALOGO[0] = {
      ...original,
      desarrollador: 'Desarrollador de prueba',
      fechaLanzamiento: '2022-02-25',
    };

    try {
      const almacen = crearAlmacen();

      await seedCatalogo(almacen.em);

      const juego = almacen.juegos.find(
        (item) => item.titulo === original.titulo,
      );

      expect(juego?.desarrollador).toBe('Desarrollador de prueba');
      expect(juego?.fechaLanzamiento).toBe('2022-02-25');
    } finally {
      CATALOGO[0] = original;
    }
  });

  it('completa la portada del catálogo solo cuando el juego no tiene una', async () => {
    const original = CATALOGO[0];
    const urlImagen = 'https://example.invalid/portada-test.png';
    CATALOGO[0] = { ...original, urlImagen };

    try {
      const almacen = crearAlmacen();
      const juego = new Juego();
      juego.titulo = original.titulo;
      almacen.juegos.push(juego);
      expect(juego.urlImagen).toBeUndefined();

      await seedCatalogo(almacen.em);
      expect(juego.urlImagen).toBe(urlImagen);

      juego.urlImagen = 'https://example.invalid/portada-previa.png';
      await seedCatalogo(almacen.em);
      expect(juego.urlImagen).toBe(
        'https://example.invalid/portada-previa.png',
      );

      const nuevoAlmacen = crearAlmacen();
      await seedCatalogo(nuevoAlmacen.em);
      expect(
        nuevoAlmacen.juegos.find((j) => j.titulo === original.titulo)
          ?.urlImagen,
      ).toBe(urlImagen);
    } finally {
      CATALOGO[0] = original;
    }
  });

  it('rechaza un título ambiguo sin elegir ni actualizar un duplicado', async () => {
    const almacen = crearAlmacen();
    for (const id of [2, 9]) {
      const juego = new Juego();
      juego.id = id;
      juego.titulo = 'Elden Ring';
      juego.descripcion = 'Conservar';
      almacen.juegos.push(juego);
    }
    await expect(seedCatalogo(almacen.em)).rejects.toThrow('Título ambiguo');
    expect(almacen.juegos.map((j) => j.descripcion)).toEqual([
      'Conservar',
      'Conservar',
    ]);
    expect(almacen.tx.flush).not.toHaveBeenCalled();
    // El rollback real lo proporciona MikroORM; este almacén no lo simula.
  });
});

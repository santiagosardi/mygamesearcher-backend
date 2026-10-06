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

  it('incluye 50 títulos distintos y clasificaciones válidas y variadas', () => {
    expect(CATALOGO).toHaveLength(50);
    expect(new Set(CATALOGO.map((j) => j.titulo)).size).toBe(50);
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

  it('reutiliza los registros y no duplica relaciones en dos cargas consecutivas', async () => {
    const almacen = crearAlmacen();
    const primera = await seedCatalogo(almacen.em);
    const relaciones = almacen.juegos.map((j) => [
      j.generos.length,
      j.plataformas.length,
      j.caracteristicas.length,
    ]);
    const segunda = await seedCatalogo(almacen.em);
    expect(primera.juegosCreados).toBe(50);
    expect(segunda.juegosCreados).toBe(0);
    expect(segunda.juegosActualizadosOReutilizados).toBe(50);
    expect(almacen.juegos).toHaveLength(50);
    expect(almacen.atributos).toHaveLength(33);
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
    expect(resultado.juegosCreados).toBe(48);
    expect(resultado.juegosActualizadosOReutilizados).toBe(2);
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

import type { EntityManager } from '@mikro-orm/mysql';
import type { FilterQuery } from '@mikro-orm/core';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Caracteristica } from '../caracteristica/caracteristica.entity';
import { Juego } from '../juego/juego.entity';
import { CARACTERISTICAS, CATALOGO, GENEROS, PLATAFORMAS } from './catalogo';

export async function seedCatalogo(em: EntityManager) {
  // Una única transacción: un error revierte toda la carga.
  return em.transactional(async (tx) => {
    async function obtenerAtributos<
      T extends Genero | Plataforma | Caracteristica,
    >(
      entidad: new () => T,
      nombres: readonly string[],
    ): Promise<Map<string, T>> {
      const resultado = new Map<string, T>();
      for (const nombre of nombres) {
        // La búsqueda SQL respeta la collation de MySQL, igual que su UNIQUE.
        let atributo: T | null = await tx.findOne<T>(entidad, {
          nombre,
        } as FilterQuery<T>);
        if (!atributo) {
          atributo = new entidad();
          atributo.nombre = nombre;
          tx.persist(atributo);
        }
        resultado.set(nombre, atributo);
      }
      return resultado;
    }

    const generos = await obtenerAtributos(Genero, GENEROS);
    const plataformas = await obtenerAtributos(Plataforma, PLATAFORMAS);
    const caracteristicas = await obtenerAtributos(
      Caracteristica,
      CARACTERISTICAS,
    );
    let creados = 0;
    let reutilizados = 0;

    for (const datos of CATALOGO) {
      const existentes = await tx.find(
        Juego,
        { titulo: datos.titulo },
        { populate: ['generos', 'plataformas', 'caracteristicas'] },
      );
      if (existentes.length > 1) {
        throw new Error(
          `Título ambiguo: "${datos.titulo}" tiene ${existentes.length} registros. No se modificará ninguno.`,
        );
      }
      const juego = existentes[0] ?? new Juego();
      if (existentes.length) reutilizados++;
      else {
        juego.titulo = datos.titulo;
        creados++;
      }
      juego.descripcion = datos.descripcion;
      if (!juego.urlImagen && datos.urlImagen) {
        juego.urlImagen = datos.urlImagen;
      }
      // Unión de relaciones: mantiene cualquier clasificación previa.
      for (const nombre of datos.generos)
        juego.generos.add(generos.get(nombre)!);
      for (const nombre of datos.plataformas)
        juego.plataformas.add(plataformas.get(nombre)!);
      for (const nombre of datos.caracteristicas)
        juego.caracteristicas.add(caracteristicas.get(nombre)!);
      tx.persist(juego);
    }
    await tx.flush();
    return {
      generosProcesados: generos.size,
      plataformasProcesadas: plataformas.size,
      caracteristicasProcesadas: caracteristicas.size,
      juegosProcesados: CATALOGO.length,
      juegosCreados: creados,
      juegosActualizadosOReutilizados: reutilizados,
    };
  });
}

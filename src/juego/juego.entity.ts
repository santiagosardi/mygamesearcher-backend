import { Collection } from '@mikro-orm/core';
import {
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { Genero } from '../genero/genero.entity';
import { Plataforma } from '../plataforma/plataforma.entity';
import { Caracteristica } from '../caracteristica/caracteristica.entity';

@Entity()
export class Juego {
  @PrimaryKey()
  id!: number;

  @Property({ length: 255 })
  titulo!: string;

  @Property({ type: 'text', nullable: true })
  descripcion?: string;

  @Property({ type: 'date', nullable: true })
  fechaLanzamiento?: string;

  @Property({ length: 255, nullable: true })
  desarrollador?: string;

  @Property({ length: 2048, nullable: true })
  urlImagen?: string;

  @ManyToMany({
    entity: () => Genero,
    owner: true,
    pivotTable: 'juego_genero',
  })
  generos = new Collection<Genero>(this);

  @ManyToMany({
    entity: () => Plataforma,
    owner: true,
    pivotTable: 'juego_plataforma',
  })
  plataformas = new Collection<Plataforma>(this);

  @ManyToMany({
    entity: () => Caracteristica,
    owner: true,
    pivotTable: 'juego_caracteristica',
  })
  caracteristicas = new Collection<Caracteristica>(this);
}

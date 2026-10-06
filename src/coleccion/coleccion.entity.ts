import { Collection } from '@mikro-orm/core';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { Usuario } from '../usuario/usuario.entity';
import { Juego } from '../juego/juego.entity';

@Entity()
@Unique({
  properties: ['usuario', 'nombre'],
  name: 'coleccion_usuario_nombre_unique',
})
export class Coleccion {
  @PrimaryKey()
  id!: number;

  @Property({ length: 100 })
  nombre!: string;

  @Property({ type: 'text', nullable: true })
  descripcion?: string;

  @ManyToOne({ entity: () => Usuario, deleteRule: 'cascade' })
  usuario!: Usuario;

  @ManyToMany({
    entity: () => Juego,
    owner: true,
    pivotTable: 'coleccion_juego',
  })
  juegos = new Collection<Juego>(this);

  @Property({ type: 'datetime', onCreate: () => new Date() })
  fechaCreacion!: Date;
}

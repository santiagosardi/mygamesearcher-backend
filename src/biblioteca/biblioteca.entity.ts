import {
  Entity,
  Enum,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { Usuario } from '../usuario/usuario.entity';
import { Juego } from '../juego/juego.entity';
import { EstadoBiblioteca } from './estado-biblioteca.enum';

@Entity()
@Unique({
  properties: ['usuario', 'juego'],
  name: 'biblioteca_usuario_juego_unique',
})
export class Biblioteca {
  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Usuario, deleteRule: 'cascade' })
  usuario!: Usuario;

  @ManyToOne({ entity: () => Juego, deleteRule: 'cascade' })
  juego!: Juego;

  @Enum({ items: () => EstadoBiblioteca, default: EstadoBiblioteca.PENDIENTE })
  estado: EstadoBiblioteca = EstadoBiblioteca.PENDIENTE;

  @Property({ default: false })
  favorito: boolean = false;

  @Property({ type: 'datetime', onCreate: () => new Date() })
  fechaAgregado!: Date;
}

import {
  Entity,
  Enum,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { RolUsuario } from './rol-usuario.enum';

@Entity()
export class Usuario {
  @PrimaryKey()
  id!: number;

  @Property({ length: 100 })
  nombre!: string;

  @Property({ length: 100, nullable: true })
  apellido?: string;

  @Property({ length: 254, unique: true })
  email!: string;

  @Enum({ items: () => RolUsuario, default: RolUsuario.USER })
  rol: RolUsuario = RolUsuario.USER;

  @Property({ default: true })
  activo: boolean = true;

  @Property({ type: 'datetime', onCreate: () => new Date() })
  fechaCreacion!: Date;
}

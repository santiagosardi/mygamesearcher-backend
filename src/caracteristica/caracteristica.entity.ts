import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
export class Caracteristica {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  nombre!: string;

  @Property({ nullable: true })
  descripcion?: string;
}

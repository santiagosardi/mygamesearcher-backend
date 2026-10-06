import { Migration } from '@mikro-orm/migrations';

export class Migration20261006065351 extends Migration {
  override name = 'Migration20261006065351';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`coleccion\` (\`id\` int unsigned not null auto_increment primary key, \`nombre\` varchar(100) not null, \`descripcion\` text null, \`usuario_id\` int unsigned not null, \`fecha_creacion\` datetime not null) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`coleccion\` add index \`coleccion_usuario_id_index\` (\`usuario_id\`);`,
    );
    this.addSql(
      `alter table \`coleccion\` add unique \`coleccion_usuario_nombre_unique\` (\`usuario_id\`, \`nombre\`);`,
    );

    this.addSql(
      `create table \`coleccion_juego\` (\`coleccion_id\` int unsigned not null, \`juego_id\` int unsigned not null, primary key (\`coleccion_id\`, \`juego_id\`)) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`coleccion_juego\` add index \`coleccion_juego_coleccion_id_index\` (\`coleccion_id\`);`,
    );
    this.addSql(
      `alter table \`coleccion_juego\` add index \`coleccion_juego_juego_id_index\` (\`juego_id\`);`,
    );

    this.addSql(
      `alter table \`coleccion\` add constraint \`coleccion_usuario_id_foreign\` foreign key (\`usuario_id\`) references \`usuario\` (\`id\`) on delete cascade;`,
    );

    this.addSql(
      `alter table \`coleccion_juego\` add constraint \`coleccion_juego_coleccion_id_foreign\` foreign key (\`coleccion_id\`) references \`coleccion\` (\`id\`) on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table \`coleccion_juego\` add constraint \`coleccion_juego_juego_id_foreign\` foreign key (\`juego_id\`) references \`juego\` (\`id\`) on update cascade on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table \`coleccion_juego\` drop foreign key \`coleccion_juego_coleccion_id_foreign\`;`,
    );

    this.addSql(`drop table if exists \`coleccion\`;`);
    this.addSql(`drop table if exists \`coleccion_juego\`;`);
  }
}

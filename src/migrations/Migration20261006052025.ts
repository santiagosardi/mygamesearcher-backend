import { Migration } from '@mikro-orm/migrations';

export class Migration20261006052025 extends Migration {
  override name = 'Migration20261006052025';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`juego\` (\`id\` int unsigned not null auto_increment primary key, \`titulo\` varchar(255) not null, \`descripcion\` text null, \`fecha_lanzamiento\` date null, \`desarrollador\` varchar(255) null, \`url_imagen\` varchar(2048) null) default character set utf8mb4 engine = InnoDB;`,
    );

    this.addSql(
      `create table \`juego_caracteristica\` (\`juego_id\` int unsigned not null, \`caracteristica_id\` int unsigned not null, primary key (\`juego_id\`, \`caracteristica_id\`)) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`juego_caracteristica\` add index \`juego_caracteristica_juego_id_index\` (\`juego_id\`);`,
    );
    this.addSql(
      `alter table \`juego_caracteristica\` add index \`juego_caracteristica_caracteristica_id_index\` (\`caracteristica_id\`);`,
    );

    this.addSql(
      `create table \`juego_genero\` (\`juego_id\` int unsigned not null, \`genero_id\` int unsigned not null, primary key (\`juego_id\`, \`genero_id\`)) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`juego_genero\` add index \`juego_genero_juego_id_index\` (\`juego_id\`);`,
    );
    this.addSql(
      `alter table \`juego_genero\` add index \`juego_genero_genero_id_index\` (\`genero_id\`);`,
    );

    this.addSql(
      `create table \`juego_plataforma\` (\`juego_id\` int unsigned not null, \`plataforma_id\` int unsigned not null, primary key (\`juego_id\`, \`plataforma_id\`)) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`juego_plataforma\` add index \`juego_plataforma_juego_id_index\` (\`juego_id\`);`,
    );
    this.addSql(
      `alter table \`juego_plataforma\` add index \`juego_plataforma_plataforma_id_index\` (\`plataforma_id\`);`,
    );

    this.addSql(
      `alter table \`juego_caracteristica\` add constraint \`juego_caracteristica_juego_id_foreign\` foreign key (\`juego_id\`) references \`juego\` (\`id\`) on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table \`juego_caracteristica\` add constraint \`juego_caracteristica_caracteristica_id_foreign\` foreign key (\`caracteristica_id\`) references \`caracteristica\` (\`id\`) on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table \`juego_genero\` add constraint \`juego_genero_juego_id_foreign\` foreign key (\`juego_id\`) references \`juego\` (\`id\`) on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table \`juego_genero\` add constraint \`juego_genero_genero_id_foreign\` foreign key (\`genero_id\`) references \`genero\` (\`id\`) on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table \`juego_plataforma\` add constraint \`juego_plataforma_juego_id_foreign\` foreign key (\`juego_id\`) references \`juego\` (\`id\`) on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table \`juego_plataforma\` add constraint \`juego_plataforma_plataforma_id_foreign\` foreign key (\`plataforma_id\`) references \`plataforma\` (\`id\`) on update cascade on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table \`juego_caracteristica\` drop foreign key \`juego_caracteristica_juego_id_foreign\`;`,
    );
    this.addSql(
      `alter table \`juego_genero\` drop foreign key \`juego_genero_juego_id_foreign\`;`,
    );
    this.addSql(
      `alter table \`juego_plataforma\` drop foreign key \`juego_plataforma_juego_id_foreign\`;`,
    );

    this.addSql(`drop table if exists \`juego\`;`);
    this.addSql(`drop table if exists \`juego_caracteristica\`;`);
    this.addSql(`drop table if exists \`juego_genero\`;`);
    this.addSql(`drop table if exists \`juego_plataforma\`;`);
  }
}

import { Migration } from '@mikro-orm/migrations';

export class Migration20261006064057 extends Migration {
  override name = 'Migration20261006064057';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`biblioteca\` (\`id\` int unsigned not null auto_increment primary key, \`usuario_id\` int unsigned not null, \`juego_id\` int unsigned not null, \`estado\` enum('PENDIENTE','JUGANDO','COMPLETADO','ABANDONADO') not null default 'PENDIENTE', \`favorito\` tinyint(1) not null default false, \`fecha_agregado\` datetime not null) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`biblioteca\` add index \`biblioteca_usuario_id_index\` (\`usuario_id\`);`,
    );
    this.addSql(
      `alter table \`biblioteca\` add index \`biblioteca_juego_id_index\` (\`juego_id\`);`,
    );
    this.addSql(
      `alter table \`biblioteca\` add unique \`biblioteca_usuario_juego_unique\` (\`usuario_id\`, \`juego_id\`);`,
    );

    this.addSql(
      `alter table \`biblioteca\` add constraint \`biblioteca_usuario_id_foreign\` foreign key (\`usuario_id\`) references \`usuario\` (\`id\`) on delete cascade;`,
    );
    this.addSql(
      `alter table \`biblioteca\` add constraint \`biblioteca_juego_id_foreign\` foreign key (\`juego_id\`) references \`juego\` (\`id\`) on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`biblioteca\`;`);
  }
}

import { Migration } from '@mikro-orm/migrations';

export class Migration20261006061240 extends Migration {
  override name = 'Migration20261006061240';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`usuario\` (\`id\` int unsigned not null auto_increment primary key, \`nombre\` varchar(100) not null, \`apellido\` varchar(100) null, \`email\` varchar(254) not null, \`rol\` enum('USER','ADMIN') not null default 'USER', \`activo\` tinyint(1) not null default true, \`fecha_creacion\` datetime not null) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`usuario\` add unique \`usuario_email_unique\` (\`email\`);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`usuario\`;`);
  }
}

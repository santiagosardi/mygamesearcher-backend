import { Migration } from '@mikro-orm/migrations';

export class Migration20261006045850 extends Migration {
  override name = 'Migration20261006045850';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`plataforma\` (\`id\` int unsigned not null auto_increment primary key, \`nombre\` varchar(255) not null, \`descripcion\` varchar(255) null) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`plataforma\` add unique \`plataforma_nombre_unique\` (\`nombre\`);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`plataforma\`;`);
  }
}

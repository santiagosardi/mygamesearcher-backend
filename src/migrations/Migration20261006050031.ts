import { Migration } from '@mikro-orm/migrations';

export class Migration20261006050031 extends Migration {
  override name = 'Migration20261006050031';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`caracteristica\` (\`id\` int unsigned not null auto_increment primary key, \`nombre\` varchar(255) not null, \`descripcion\` varchar(255) null) default character set utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `alter table \`caracteristica\` add unique \`caracteristica_nombre_unique\` (\`nombre\`);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`caracteristica\`;`);
  }
}

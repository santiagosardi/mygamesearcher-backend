import { Migration } from '@mikro-orm/migrations';

export class Migration20261006043513 extends Migration {
  override name = 'Migration20261006043513';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`genero\` (\`id\` int unsigned not null auto_increment primary key, \`nombre\` varchar(255) not null, \`descripcion\` varchar(255) null) default character set utf8mb4 engine = InnoDB;`,
    );
  }
}

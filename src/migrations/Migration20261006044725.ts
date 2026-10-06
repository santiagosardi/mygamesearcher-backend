import { Migration } from '@mikro-orm/migrations';

export class Migration20261006044725 extends Migration {
  override name = 'Migration20261006044725';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table \`genero\` add unique \`genero_nombre_unique\` (\`nombre\`);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`genero\` drop index \`genero_nombre_unique\`;`);
  }
}

import { Migration } from '@mikro-orm/migrations';

export class Migration20261006224845 extends Migration {
  override name = 'Migration20261006224845';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table \`usuario\` add \`password_hash\` varchar(255) null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`usuario\` drop column \`password_hash\`;`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationPreferences1740420000000
  implements MigrationInterface
{
  name = 'AddNotificationPreferences1740420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`notification_preferences\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`userId\` int NOT NULL,
        \`morningEnabled\` tinyint NOT NULL DEFAULT 1,
        \`eveningEnabled\` tinyint NOT NULL DEFAULT 1,
        \`morningTime\` varchar(5) NOT NULL DEFAULT '09:00',
        \`eveningTime\` varchar(5) NOT NULL DEFAULT '21:00',
        UNIQUE INDEX \`IDX_notification_preferences_userId\` (\`userId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification_preferences\` ADD CONSTRAINT \`FK_notification_preferences_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notification_preferences\` DROP FOREIGN KEY \`FK_notification_preferences_userId\``,
    );
    await queryRunner.query(`DROP TABLE \`notification_preferences\``);
  }
}

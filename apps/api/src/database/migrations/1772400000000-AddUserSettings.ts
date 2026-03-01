import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSettings1772400000000 implements MigrationInterface {
  name = 'AddUserSettings1772400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = (await queryRunner.query(
      `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'settings'`,
    )) as [{ cnt: string }];
    if (Number(result[0].cnt) === 0) {
      await queryRunner.query(
        `ALTER TABLE \`users\` ADD \`settings\` json NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`settings\``);
  }
}

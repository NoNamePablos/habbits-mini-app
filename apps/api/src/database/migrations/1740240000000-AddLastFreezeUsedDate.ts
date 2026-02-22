import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastFreezeUsedDate1740240000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN last_freeze_used_date DATE NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN last_freeze_used_date`,
    );
  }
}

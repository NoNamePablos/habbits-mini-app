import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAbandonReasonToChallenge1772200000000 implements MigrationInterface {
  name = 'AddAbandonReasonToChallenge1772200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`challenges\` ADD \`abandonReason\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`challenges\` DROP COLUMN \`abandonReason\``,
    );
  }
}

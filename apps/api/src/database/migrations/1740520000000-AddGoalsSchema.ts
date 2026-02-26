import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoalsSchema1740520000000 implements MigrationInterface {
  name = 'AddGoalsSchema1740520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`goals\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL, \`type\` enum ('completion_rate', 'streak_days', 'total_xp', 'total_completions') NOT NULL, \`targetValue\` int NOT NULL, \`durationDays\` int NOT NULL, \`startDate\` date NOT NULL, \`deadline\` date NOT NULL, \`status\` enum ('active', 'completed', 'failed') NOT NULL DEFAULT 'active', \`xpReward\` int NOT NULL DEFAULT '0', \`completedAt\` timestamp NULL, INDEX \`IDX_goals_userId\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`goals\` ADD CONSTRAINT \`FK_goals_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`xp_transactions\` MODIFY COLUMN \`source\` enum ('habit_complete', 'streak_bonus', 'achievement', 'daily_login', 'challenge', 'goal') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`xp_transactions\` MODIFY COLUMN \`source\` enum ('habit_complete', 'streak_bonus', 'achievement', 'daily_login', 'challenge') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`goals\` DROP FOREIGN KEY \`FK_goals_userId\``,
    );
    await queryRunner.query(`DROP TABLE \`goals\``);
  }
}

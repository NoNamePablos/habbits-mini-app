import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChallengesSchema1740320000000 implements MigrationInterface {
  name = 'AddChallengesSchema1740320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`challenges\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` text NULL, \`icon\` varchar(50) NOT NULL DEFAULT 'Target', \`color\` varchar(7) NOT NULL DEFAULT '#8774e1', \`durationDays\` int NOT NULL, \`allowedMisses\` int NOT NULL DEFAULT '0', \`startDate\` date NOT NULL, \`endDate\` date NOT NULL, \`status\` enum ('active', 'completed', 'failed', 'abandoned') NOT NULL DEFAULT 'active', \`completedDays\` int NOT NULL DEFAULT '0', \`missedDays\` int NOT NULL DEFAULT '0', \`currentStreak\` int NOT NULL DEFAULT '0', \`bestStreak\` int NOT NULL DEFAULT '0', \`completedAt\` timestamp NULL, INDEX \`IDX_challenges_userId\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`challenge_days\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`challengeId\` int NOT NULL, \`userId\` int NOT NULL, \`dayDate\` date NOT NULL, \`status\` enum ('completed', 'missed') NOT NULL DEFAULT 'completed', \`note\` text NULL, \`xpEarned\` int NOT NULL DEFAULT '0', INDEX \`IDX_challenge_days_challengeId\` (\`challengeId\`), INDEX \`IDX_challenge_days_userId\` (\`userId\`), UNIQUE INDEX \`IDX_challenge_days_challengeId_dayDate\` (\`challengeId\`, \`dayDate\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`challenges\` ADD CONSTRAINT \`FK_challenges_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`challenge_days\` ADD CONSTRAINT \`FK_challenge_days_challengeId\` FOREIGN KEY (\`challengeId\`) REFERENCES \`challenges\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`challenge_days\` ADD CONSTRAINT \`FK_challenge_days_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`achievements\` MODIFY COLUMN \`category\` enum ('streak', 'completion', 'social', 'time', 'challenge') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`achievements\` MODIFY COLUMN \`category\` enum ('streak', 'completion', 'social', 'time') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`challenge_days\` DROP FOREIGN KEY \`FK_challenge_days_userId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`challenge_days\` DROP FOREIGN KEY \`FK_challenge_days_challengeId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`challenges\` DROP FOREIGN KEY \`FK_challenges_userId\``,
    );
    await queryRunner.query(`DROP TABLE \`challenge_days\``);
    await queryRunner.query(`DROP TABLE \`challenges\``);
  }
}

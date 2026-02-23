import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1740230000000 implements MigrationInterface {
  name = 'InitSchema1740230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`telegramId\` bigint NOT NULL, \`username\` varchar(255) NULL, \`firstName\` varchar(255) NULL, \`lastName\` varchar(255) NULL, \`photoUrl\` varchar(255) NULL, \`languageCode\` varchar(10) NULL, \`xp\` int NOT NULL DEFAULT '0', \`level\` int NOT NULL DEFAULT '1', \`streakFreezes\` int NOT NULL DEFAULT '0', \`lastFreezeUsedDate\` date NULL, \`lastLoginDate\` date NULL, \`timezone\` varchar(50) NOT NULL DEFAULT 'UTC', UNIQUE INDEX \`IDX_df18d17f84763558ac84192c75\` (\`telegramId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`habits\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`icon\` varchar(50) NULL, \`color\` varchar(7) NULL, \`frequency\` enum ('daily', 'weekly', 'custom') NOT NULL DEFAULT 'daily', \`targetDays\` json NULL, \`type\` enum ('boolean', 'numeric', 'duration') NOT NULL DEFAULT 'boolean', \`targetValue\` float NULL, \`currentStreak\` int NOT NULL DEFAULT '0', \`bestStreak\` int NOT NULL DEFAULT '0', \`sortOrder\` int NOT NULL DEFAULT '0', \`timeOfDay\` enum ('morning', 'afternoon', 'evening', 'anytime') NOT NULL DEFAULT 'anytime', \`isActive\` tinyint NOT NULL DEFAULT 1, INDEX \`IDX_356d1f144ceadad6942fa17af6\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`habit_completions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`habitId\` int NOT NULL, \`userId\` int NOT NULL, \`completedDate\` date NOT NULL, \`value\` float NULL, \`xpEarned\` int NOT NULL DEFAULT '0', \`note\` text NULL, INDEX \`IDX_44831573ebd77b962aec5beca0\` (\`habitId\`), INDEX \`IDX_a204f1f41d59595cb69fdae5a5\` (\`userId\`), INDEX \`IDX_5aad0008eaeb9179accdbee027\` (\`completedDate\`), INDEX \`IDX_b031b943aed1997af843ea4928\` (\`userId\`, \`completedDate\`), UNIQUE INDEX \`IDX_2f8136cdd327ff0c85507fcd0c\` (\`habitId\`, \`completedDate\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`xp_transactions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`amount\` int NOT NULL, \`source\` enum ('habit_complete', 'streak_bonus', 'achievement', 'daily_login', 'challenge') NOT NULL, \`referenceId\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_0c00e30c10daa7e964c6220672\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`achievements\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`key\` varchar(100) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`icon\` varchar(50) NULL, \`category\` enum ('streak', 'completion', 'social', 'time') NOT NULL, \`criteria\` json NOT NULL, \`xpReward\` int NOT NULL DEFAULT '0', \`isHidden\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_4fe946ae1fdbc64abf0c48ecb8\` (\`key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_achievements\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`achievementId\` int NOT NULL, \`unlockedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_c1acd69cf91b1e353634c152dd\` (\`userId\`, \`achievementId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`habits\` ADD CONSTRAINT \`FK_356d1f144ceadad6942fa17af64\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`habit_completions\` ADD CONSTRAINT \`FK_44831573ebd77b962aec5beca06\` FOREIGN KEY (\`habitId\`) REFERENCES \`habits\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`habit_completions\` ADD CONSTRAINT \`FK_a204f1f41d59595cb69fdae5a54\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`xp_transactions\` ADD CONSTRAINT \`FK_0c00e30c10daa7e964c62206729\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_achievements\` ADD CONSTRAINT \`FK_3ac6bc9da3e8a56f3f7082012dd\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_achievements\` ADD CONSTRAINT \`FK_6a5a5816f54d0044ba5f3dc2b74\` FOREIGN KEY (\`achievementId\`) REFERENCES \`achievements\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_achievements\` DROP FOREIGN KEY \`FK_6a5a5816f54d0044ba5f3dc2b74\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_achievements\` DROP FOREIGN KEY \`FK_3ac6bc9da3e8a56f3f7082012dd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`xp_transactions\` DROP FOREIGN KEY \`FK_0c00e30c10daa7e964c62206729\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`habit_completions\` DROP FOREIGN KEY \`FK_a204f1f41d59595cb69fdae5a54\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`habit_completions\` DROP FOREIGN KEY \`FK_44831573ebd77b962aec5beca06\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`habits\` DROP FOREIGN KEY \`FK_356d1f144ceadad6942fa17af64\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c1acd69cf91b1e353634c152dd\` ON \`user_achievements\``,
    );
    await queryRunner.query(`DROP TABLE \`user_achievements\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_4fe946ae1fdbc64abf0c48ecb8\` ON \`achievements\``,
    );
    await queryRunner.query(`DROP TABLE \`achievements\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_0c00e30c10daa7e964c6220672\` ON \`xp_transactions\``,
    );
    await queryRunner.query(`DROP TABLE \`xp_transactions\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_2f8136cdd327ff0c85507fcd0c\` ON \`habit_completions\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b031b943aed1997af843ea4928\` ON \`habit_completions\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_5aad0008eaeb9179accdbee027\` ON \`habit_completions\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a204f1f41d59595cb69fdae5a5\` ON \`habit_completions\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_44831573ebd77b962aec5beca0\` ON \`habit_completions\``,
    );
    await queryRunner.query(`DROP TABLE \`habit_completions\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_356d1f144ceadad6942fa17af6\` ON \`habits\``,
    );
    await queryRunner.query(`DROP TABLE \`habits\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_df18d17f84763558ac84192c75\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}

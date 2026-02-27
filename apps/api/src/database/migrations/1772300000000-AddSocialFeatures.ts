import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSocialFeatures1772300000000 implements MigrationInterface {
  name = 'AddSocialFeatures1772300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add friendInviteCode to users (skip if already exists)
    const [friendInviteCodeExists] = await queryRunner.query(
      `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'friendInviteCode'`,
    );
    if (Number(friendInviteCodeExists.cnt) === 0) {
      await queryRunner.query(
        `ALTER TABLE \`users\` ADD \`friendInviteCode\` varchar(16) NULL UNIQUE`,
      );
    }

    // Add inviteCode to challenges (skip if already exists)
    const [inviteCodeExists] = await queryRunner.query(
      `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'challenges' AND COLUMN_NAME = 'inviteCode'`,
    );
    if (Number(inviteCodeExists.cnt) === 0) {
      await queryRunner.query(
        `ALTER TABLE \`challenges\` ADD \`inviteCode\` varchar(8) NULL UNIQUE`,
      );
    }

    // Drop old unique constraint on challenge_days (challengeId + dayDate)
    // The actual index name is IDX_98ed1bb2850121491affee410a (TypeORM auto-generated)
    await queryRunner.query(
      `ALTER TABLE \`challenge_days\` DROP INDEX \`IDX_98ed1bb2850121491affee410a\``,
    );

    // Add new unique constraint (challengeId + userId + dayDate)
    await queryRunner.query(
      `ALTER TABLE \`challenge_days\` ADD UNIQUE INDEX \`IDX_challenge_days_challengeId_userId_dayDate\` (\`challengeId\`, \`userId\`, \`dayDate\`)`,
    );

    // Create challenge_participants table
    await queryRunner.query(
      `CREATE TABLE \`challenge_participants\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`challengeId\` int NOT NULL,
        \`userId\` int NOT NULL,
        \`status\` enum ('active', 'completed', 'failed', 'abandoned') NOT NULL DEFAULT 'active',
        \`completedDays\` int NOT NULL DEFAULT '0',
        \`missedDays\` int NOT NULL DEFAULT '0',
        \`currentStreak\` int NOT NULL DEFAULT '0',
        \`bestStreak\` int NOT NULL DEFAULT '0',
        \`completedAt\` timestamp NULL,
        \`abandonReason\` varchar(255) NULL,
        INDEX \`IDX_challenge_participants_challengeId\` (\`challengeId\`),
        INDEX \`IDX_challenge_participants_userId\` (\`userId\`),
        UNIQUE INDEX \`IDX_challenge_participants_unique\` (\`challengeId\`, \`userId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `ALTER TABLE \`challenge_participants\` ADD CONSTRAINT \`FK_challenge_participants_challengeId\` FOREIGN KEY (\`challengeId\`) REFERENCES \`challenges\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`challenge_participants\` ADD CONSTRAINT \`FK_challenge_participants_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Create friendships table
    await queryRunner.query(
      `CREATE TABLE \`friendships\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`requesterId\` int NOT NULL,
        \`addresseeId\` int NOT NULL,
        \`status\` enum ('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
        INDEX \`IDX_friendships_requesterId\` (\`requesterId\`),
        INDEX \`IDX_friendships_addresseeId\` (\`addresseeId\`),
        UNIQUE INDEX \`IDX_friendships_unique\` (\`requesterId\`, \`addresseeId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `ALTER TABLE \`friendships\` ADD CONSTRAINT \`FK_friendships_requesterId\` FOREIGN KEY (\`requesterId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`friendships\` ADD CONSTRAINT \`FK_friendships_addresseeId\` FOREIGN KEY (\`addresseeId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`friendships\` DROP FOREIGN KEY \`FK_friendships_addresseeId\``);
    await queryRunner.query(`ALTER TABLE \`friendships\` DROP FOREIGN KEY \`FK_friendships_requesterId\``);
    await queryRunner.query(`DROP TABLE \`friendships\``);

    await queryRunner.query(`ALTER TABLE \`challenge_participants\` DROP FOREIGN KEY \`FK_challenge_participants_userId\``);
    await queryRunner.query(`ALTER TABLE \`challenge_participants\` DROP FOREIGN KEY \`FK_challenge_participants_challengeId\``);
    await queryRunner.query(`DROP TABLE \`challenge_participants\``);

    await queryRunner.query(`ALTER TABLE \`challenge_days\` DROP INDEX \`IDX_challenge_days_challengeId_userId_dayDate\``);
    await queryRunner.query(`ALTER TABLE \`challenge_days\` ADD UNIQUE INDEX \`IDX_challenge_days_challengeId_dayDate\` (\`challengeId\`, \`dayDate\`)`);

    await queryRunner.query(`ALTER TABLE \`challenges\` DROP COLUMN \`inviteCode\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`friendInviteCode\``);
  }
}

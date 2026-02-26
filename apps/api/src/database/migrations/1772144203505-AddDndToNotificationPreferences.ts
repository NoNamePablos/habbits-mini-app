import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDndToNotificationPreferences1772144203505 implements MigrationInterface {
    name = 'AddDndToNotificationPreferences1772144203505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` DROP FOREIGN KEY \`FK_notification_preferences_userId\``);
        await queryRunner.query(`ALTER TABLE \`goals\` DROP FOREIGN KEY \`FK_goals_userId\``);
        await queryRunner.query(`ALTER TABLE \`xp_transactions\` DROP FOREIGN KEY \`FK_0c00e30c10daa7e964c62206729\``);
        await queryRunner.query(`ALTER TABLE \`challenges\` DROP FOREIGN KEY \`FK_challenges_userId\``);
        await queryRunner.query(`ALTER TABLE \`challenge_days\` DROP FOREIGN KEY \`FK_challenge_days_challengeId\``);
        await queryRunner.query(`ALTER TABLE \`challenge_days\` DROP FOREIGN KEY \`FK_challenge_days_userId\``);
        await queryRunner.query(`ALTER TABLE \`user_achievements\` DROP FOREIGN KEY \`FK_3ac6bc9da3e8a56f3f7082012dd\``);
        await queryRunner.query(`DROP INDEX \`IDX_df18d17f84763558ac84192c75\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_notification_preferences_userId\` ON \`notification_preferences\``);
        await queryRunner.query(`DROP INDEX \`IDX_goals_userId\` ON \`goals\``);
        await queryRunner.query(`DROP INDEX \`IDX_challenges_userId\` ON \`challenges\``);
        await queryRunner.query(`DROP INDEX \`IDX_challenge_days_challengeId\` ON \`challenge_days\``);
        await queryRunner.query(`DROP INDEX \`IDX_challenge_days_challengeId_dayDate\` ON \`challenge_days\``);
        await queryRunner.query(`DROP INDEX \`IDX_challenge_days_userId\` ON \`challenge_days\``);
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` ADD \`dndEnabled\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` ADD \`dndStart\` varchar(5) NOT NULL DEFAULT '23:00'`);
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` ADD \`dndEnd\` varchar(5) NOT NULL DEFAULT '07:00'`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_df18d17f84763558ac84192c75\` (\`telegramId\`)`);
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` ADD UNIQUE INDEX \`IDX_b70c44e8b00757584a39322559\` (\`userId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_b70c44e8b00757584a39322559\` ON \`notification_preferences\` (\`userId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_57dd8a3fc26eb760d076bf8840\` ON \`goals\` (\`userId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_71457d92a08a52ceaa85edb01c\` ON \`challenges\` (\`userId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_54991ab980addc79fe257f9efa\` ON \`challenge_days\` (\`challengeId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_971708a2f2cf8d1028d26be6d1\` ON \`challenge_days\` (\`userId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_98ed1bb2850121491affee410a\` ON \`challenge_days\` (\`challengeId\`, \`dayDate\`)`);
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` ADD CONSTRAINT \`FK_b70c44e8b00757584a393225593\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`goals\` ADD CONSTRAINT \`FK_57dd8a3fc26eb760d076bf8840e\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`xp_transactions\` ADD CONSTRAINT \`FK_0c00e30c10daa7e964c62206729\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`challenges\` ADD CONSTRAINT \`FK_71457d92a08a52ceaa85edb01c4\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`challenge_days\` ADD CONSTRAINT \`FK_54991ab980addc79fe257f9efad\` FOREIGN KEY (\`challengeId\`) REFERENCES \`challenges\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`challenge_days\` ADD CONSTRAINT \`FK_971708a2f2cf8d1028d26be6d1e\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_achievements\` ADD CONSTRAINT \`FK_3ac6bc9da3e8a56f3f7082012dd\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_achievements\` DROP FOREIGN KEY \`FK_3ac6bc9da3e8a56f3f7082012dd\``);
        await queryRunner.query(`ALTER TABLE \`challenge_days\` DROP FOREIGN KEY \`FK_971708a2f2cf8d1028d26be6d1e\``);
        await queryRunner.query(`ALTER TABLE \`challenge_days\` DROP FOREIGN KEY \`FK_54991ab980addc79fe257f9efad\``);
        await queryRunner.query(`ALTER TABLE \`challenges\` DROP FOREIGN KEY \`FK_71457d92a08a52ceaa85edb01c4\``);
        await queryRunner.query(`ALTER TABLE \`xp_transactions\` DROP FOREIGN KEY \`FK_0c00e30c10daa7e964c62206729\``);
        await queryRunner.query(`ALTER TABLE \`goals\` DROP FOREIGN KEY \`FK_57dd8a3fc26eb760d076bf8840e\``);
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` DROP FOREIGN KEY \`FK_b70c44e8b00757584a393225593\``);
        await queryRunner.query(`DROP INDEX \`IDX_98ed1bb2850121491affee410a\` ON \`challenge_days\``);
        await queryRunner.query(`DROP INDEX \`IDX_971708a2f2cf8d1028d26be6d1\` ON \`challenge_days\``);
        await queryRunner.query(`DROP INDEX \`IDX_54991ab980addc79fe257f9efa\` ON \`challenge_days\``);
        await queryRunner.query(`DROP INDEX \`IDX_71457d92a08a52ceaa85edb01c\` ON \`challenges\``);
        await queryRunner.query(`DROP INDEX \`IDX_57dd8a3fc26eb760d076bf8840\` ON \`goals\``);
        await queryRunner.query(`DROP INDEX \`REL_b70c44e8b00757584a39322559\` ON \`notification_preferences\``);
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` DROP INDEX \`IDX_b70c44e8b00757584a39322559\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_df18d17f84763558ac84192c75\``);
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` DROP COLUMN \`dndEnd\``);
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` DROP COLUMN \`dndStart\``);
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` DROP COLUMN \`dndEnabled\``);
        await queryRunner.query(`CREATE INDEX \`IDX_challenge_days_userId\` ON \`challenge_days\` (\`userId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_challenge_days_challengeId_dayDate\` ON \`challenge_days\` (\`challengeId\`, \`dayDate\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_challenge_days_challengeId\` ON \`challenge_days\` (\`challengeId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_challenges_userId\` ON \`challenges\` (\`userId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_goals_userId\` ON \`goals\` (\`userId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_notification_preferences_userId\` ON \`notification_preferences\` (\`userId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_df18d17f84763558ac84192c75\` ON \`users\` (\`telegramId\`)`);
        await queryRunner.query(`ALTER TABLE \`user_achievements\` ADD CONSTRAINT \`FK_3ac6bc9da3e8a56f3f7082012dd\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`challenge_days\` ADD CONSTRAINT \`FK_challenge_days_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`challenge_days\` ADD CONSTRAINT \`FK_challenge_days_challengeId\` FOREIGN KEY (\`challengeId\`) REFERENCES \`challenges\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`challenges\` ADD CONSTRAINT \`FK_challenges_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`xp_transactions\` ADD CONSTRAINT \`FK_0c00e30c10daa7e964c62206729\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`goals\` ADD CONSTRAINT \`FK_goals_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notification_preferences\` ADD CONSTRAINT \`FK_notification_preferences_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

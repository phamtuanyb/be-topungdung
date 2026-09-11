import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppSuggestions1780600000000 implements MigrationInterface {
  name = 'AddAppSuggestions1780600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "app_suggestions" (
        "id" SERIAL PRIMARY KEY,
        "appName" varchar(255) NOT NULL,
        "website" varchar(500),
        "categorySlug" varchar(100),
        "reason" text,
        "submitterName" varchar(255),
        "submitterEmail" varchar(255),
        "status" varchar(20) NOT NULL DEFAULT 'new',
        "adminNote" text,
        "submitterKey" varchar(64),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_app_suggestions_status"
          CHECK ("status" IN ('new','reviewing','accepted','rejected'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_app_suggestions_status" ON "app_suggestions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_app_suggestions_createdAt" ON "app_suggestions" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_app_suggestions_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_app_suggestions_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "app_suggestions"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppVotes1780500000000 implements MigrationInterface {
  name = 'AddAppVotes1780500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "app_votes" (
        "id"        SERIAL PRIMARY KEY,
        "postId"    integer NOT NULL,
        "rating"    smallint NOT NULL,
        "voterKey"  character varying(64) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_app_votes_post" FOREIGN KEY ("postId")
          REFERENCES "posts"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_app_votes_rating" CHECK ("rating" >= 1 AND "rating" <= 5)
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_app_votes_post_voter" ON "app_votes" ("postId", "voterKey")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_app_votes_postId" ON "app_votes" ("postId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_app_votes_voterKey" ON "app_votes" ("voterKey")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "app_votes"`);
  }
}

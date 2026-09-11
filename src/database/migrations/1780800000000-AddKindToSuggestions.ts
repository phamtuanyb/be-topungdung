import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thêm cột phân loại cho bảng đề xuất.
 *
 * Khách giờ gửi được hai thứ: đề xuất ứng dụng mới (nút trên header) và prompt
 * cho thư viện `/prompt`. Hai luồng dùng chung bảng và chung màn duyệt của
 * admin — dựng bảng riêng chỉ để chứa vài trường gần giống nhau là thừa, và
 * sẽ khiến admin phải nhìn hai hàng đợi.
 *
 * Bản ghi cũ mặc định là 'app' để không phải sửa dữ liệu đã có.
 */
export class AddKindToSuggestions1780800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "app_suggestions"
        ADD COLUMN IF NOT EXISTS "kind" VARCHAR(20) NOT NULL DEFAULT 'app'
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_app_suggestions_kind" ON "app_suggestions" ("kind")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_app_suggestions_kind"`);
    await queryRunner.query(`ALTER TABLE "app_suggestions" DROP COLUMN IF EXISTS "kind"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bật `unaccent` để tìm kiếm bỏ qua dấu tiếng Việt.
 *
 * Người Việt rất hay gõ không dấu khi tìm ("hoc tieng anh", "hop truc tuyen").
 * Nếu thiếu extension này, truy vấn tìm kiếm ở PostsService sẽ lỗi ở môi trường
 * mới dựng — nên phải khai bằng migration chứ không cài tay.
 */
export class AddUnaccentExtension1780700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Không gỡ extension: có thể còn đối tượng khác trong DB đang dùng.
    // Gỡ nhầm sẽ làm hỏng truy vấn tìm kiếm mà không báo lỗi rõ ràng.
  }
}

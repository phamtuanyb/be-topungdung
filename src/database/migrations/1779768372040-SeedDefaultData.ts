import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mật khẩu admin KHÔNG được ghi trong mã nguồn.
 *
 * Trước đây tệp này chứa sẵn chuỗi băm kèm chú thích nói rõ mật khẩu gốc, nên
 * bất kỳ ai đọc được repo là đăng nhập được vào trang quản trị.
 *
 * Giờ mật khẩu lấy từ biến môi trường `SEED_ROOT_PASSWORD`. Không khai biến thì
 * tài khoản vẫn được tạo nhưng với chuỗi băm ngẫu nhiên không ai đăng nhập được
 * — buộc người dựng hệ thống phải chủ động đặt lại mật khẩu.
 */
function rootPasswordHash(): string {
  const pw = process.env.SEED_ROOT_PASSWORD;
  if (pw) return bcrypt.hashSync(pw, 12);
  // Không có mật khẩu nào khớp được chuỗi băm sinh từ dữ liệu ngẫu nhiên này.
  return bcrypt.hashSync(randomBytes(32).toString('hex'), 12);
}

export class SeedDefaultData1779768372040 implements MigrationInterface {
  name = 'SeedDefaultData1779768372040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Admin mặc định ──────────────────────────────────────────────────────
    const email = process.env.SEED_ROOT_EMAIL || 'admin@topungdung.net';
    await queryRunner.query(
      `INSERT INTO "users" ("email", "passwordHash", "fullName", "role", "status")
       VALUES ($1, $2, 'TopỨngDụng Admin', 'admin', 'active')
       ON CONFLICT ("email") DO NOTHING`,
      [email, rootPasswordHash()],
    );

    // ── Danh mục mặc định ───────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "categories" ("name", "slug", "description", "status") VALUES
        ('Tin tức',   'tin-tuc',   'Tin tức tổng hợp',  'active'),
        ('Công nghệ', 'cong-nghe', 'Tin tức công nghệ', 'active'),
        ('Kinh tế',   'kinh-te',   'Tin tức kinh tế',   'active'),
        ('Thể thao',  'the-thao',  'Tin tức thể thao',  'active'),
        ('Giải trí',  'giai-tri',  'Tin tức giải trí',  'active'),
        ('Sức khỏe',  'suc-khoe',  'Tin tức sức khỏe',  'active')
      ON CONFLICT ("slug") DO NOTHING
    `);

    // ── Menu điều hướng mặc định ─────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "menus" ("name", "slug", "description")
      VALUES ('Nav Menu', 'nav-menu', 'Menu điều hướng chính')
      ON CONFLICT ("slug") DO NOTHING
    `);

    // ── Items cho nav-menu ───────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "menu_items" ("menuId", "label", "type", "url", "order", "depth")
      SELECT m.id, 'Trang chủ', 'custom', '/', 0, 0
      FROM "menus" m WHERE m.slug = 'nav-menu'
      AND NOT EXISTS (
        SELECT 1 FROM "menu_items" mi WHERE mi."menuId" = m.id AND mi."label" = 'Trang chủ'
      )
    `);

    await queryRunner.query(`
      INSERT INTO "menu_items" ("menuId", "label", "type", "url", "order", "depth")
      SELECT m.id, 'Tin tức', 'custom', '/tin-tuc', 1, 0
      FROM "menus" m WHERE m.slug = 'nav-menu'
      AND NOT EXISTS (
        SELECT 1 FROM "menu_items" mi WHERE mi."menuId" = m.id AND mi."label" = 'Tin tức'
      )
    `);

    await queryRunner.query(`
      INSERT INTO "menu_items" ("menuId", "label", "type", "url", "order", "depth")
      SELECT m.id, 'Liên hệ', 'custom', '/lien-he', 2, 0
      FROM "menus" m WHERE m.slug = 'nav-menu'
      AND NOT EXISTS (
        SELECT 1 FROM "menu_items" mi WHERE mi."menuId" = m.id AND mi."label" = 'Liên hệ'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "menu_items" WHERE "menuId" IN (SELECT id FROM "menus" WHERE slug = 'nav-menu')`);
    await queryRunner.query(`DELETE FROM "menus" WHERE "slug" = 'nav-menu'`);
    await queryRunner.query(`DELETE FROM "categories" WHERE "slug" IN ('tin-tuc','cong-nghe','kinh-te','the-thao','giai-tri','suc-khoe')`);
    // Xoá đúng tài khoản mà phần up đã tạo, theo cùng biến môi trường.
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [
      process.env.SEED_ROOT_EMAIL || 'admin@topungdung.net',
    ]);
  }
}

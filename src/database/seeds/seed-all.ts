import { config } from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Category } from '../../entities/category.entity';
import { User } from '../../entities/user.entity';
import { Menu } from '../../entities/menu.entity';
import { MenuItem } from '../../entities/menu-item.entity';
import { Post } from '../../entities/post.entity';
import { SiteSettings } from '../../entities/site-settings.entity';
import { Media } from '../../entities/media.entity';
import { ContactSubmission } from '../../entities/contact-submission.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'news_db',
  entities: [User, Category, Menu, MenuItem, Post, SiteSettings, Media, ContactSubmission],
  synchronize: false,
});

const SNAPSHOT = path.resolve(__dirname, 'snapshot.json');

// Bật bằng `npm run seed:all -- --reset` để TRUNCATE sạch trước khi restore (cẩn thận: mất hết data hiện có).
const RESET = process.argv.includes('--reset');

/**
 * Xếp lại để dòng cha luôn đứng trước dòng con.
 *
 * bulkInsert chèn từng dòng theo thứ tự trong snapshot, mà dump-all không đảm
 * bảo cha ra trước con: với 96 danh mục, một dòng con đứng trước cha là vướng
 * FK_categories_parent và cả đợt nạp dừng lại. Snapshot cũ chỉ 12 danh mục nên
 * tình cờ không lộ. Duyệt theo tầng từ gốc; dòng nào cha không tồn tại thì đẩy
 * xuống cuối và báo, không âm thầm bỏ.
 */
function sapXepChaTruoc(rows: any[], khoaCha = 'parentId'): any[] {
  const coId = new Set(rows.map((r) => r.id));
  const daXep: any[] = [];
  const daThay = new Set<number>();
  let conLai = rows.slice();
  while (conLai.length) {
    const luot = conLai.filter((r) => r[khoaCha] == null || daThay.has(r[khoaCha]) || !coId.has(r[khoaCha]));
    if (!luot.length) break; // vòng lặp cha-con — không xếp được nữa
    for (const r of luot) { daXep.push(r); daThay.add(r.id); }
    const lay = new Set(luot.map((r) => r.id));
    conLai = conLai.filter((r) => !lay.has(r.id));
  }
  if (conLai.length) {
    console.log(`⚠️  ${conLai.length} dòng tham chiếu cha theo vòng, chèn cuối: ${conLai.map((r) => r.id).join(', ')}`);
    daXep.push(...conLai);
  }
  return daXep;
}

async function bulkInsert(table: string, rows: any[]) {
  if (!rows.length) return;
  const sample = rows[0];
  const columns = Object.keys(sample).filter((k) => sample[k] !== undefined);
  const colSql = columns.map((c) => `"${c}"`).join(', ');

  // Insert từng dòng để dễ ON CONFLICT theo PK.
  for (const row of rows) {
    const values = columns.map((c) => row[c]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    await dataSource.query(
      `INSERT INTO "${table}" (${colSql}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
      values,
    );
  }
}

async function resetSequence(table: string, idCol = 'id') {
  await dataSource.query(
    `SELECT setval(pg_get_serial_sequence('"${table}"', '${idCol}'),
       COALESCE((SELECT MAX("${idCol}") FROM "${table}"), 1), true)`,
  );
}

async function run() {
  if (!fs.existsSync(SNAPSHOT)) {
    console.error(`❌ Không tìm thấy snapshot: ${SNAPSHOT}`);
    console.error('   Chạy "npm run dump:all" trước trên máy có dữ liệu gốc.');
    process.exit(1);
  }

  await dataSource.initialize();
  console.log('📦 Kết nối DB thành công');

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
  console.log(`📄 Đọc snapshot (export ${snapshot.exportedAt})`);

  if (RESET) {
    console.log('⚠️  RESET mode: xoá sạch dữ liệu hiện tại...');
    await dataSource.query(`
      TRUNCATE TABLE
        "contact_submissions",
        "media",
        "site_settings",
        "menu_items",
        "menus",
        "posts",
        "categories",
        "users"
      RESTART IDENTITY CASCADE
    `);
  }

  // Thứ tự bắt buộc theo FK: users → categories → posts; menus → menu_items.
  await bulkInsert('users', snapshot.users);
  console.log(`✅ users:               ${snapshot.users.length}`);

  // snapshot.json cố ý KHÔNG chứa băm mật khẩu (dump-all xoá đi để không đưa lên
  // kho công khai). Nạp nguyên xi thì mọi tài khoản đều không đăng nhập được.
  // Đặt lại từ SEED_ADMIN_PASSWORD cho những tài khoản đang trống; không có
  // biến thì báo to, vì đây là lỗi chỉ lộ ra lúc đứng trước màn hình đăng nhập.
  const trong = await dataSource.query(
    `SELECT id, email FROM "users" WHERE "passwordHash" IS NULL OR "passwordHash" = ''`,
  );
  if (trong.length > 0) {
    const pw = process.env.SEED_ADMIN_PASSWORD;
    if (pw) {
      const hash = await bcrypt.hash(pw, 12);
      await dataSource.query(
        `UPDATE "users" SET "passwordHash" = $1 WHERE "passwordHash" IS NULL OR "passwordHash" = ''`,
        [hash],
      );
      console.log(`✅ đặt mật khẩu từ SEED_ADMIN_PASSWORD cho ${trong.length} tài khoản: ${trong.map((u: any) => u.email).join(', ')}`);
      console.log('   → đăng nhập xong hãy đổi mật khẩu trong /admin/users rồi xoá biến này khỏi .env');
    } else {
      console.log(`⚠️  ${trong.length} tài khoản KHÔNG đăng nhập được vì băm mật khẩu rỗng: ${trong.map((u: any) => u.email).join(', ')}`);
      console.log('   → đặt SEED_ADMIN_PASSWORD trong .env rồi chạy lại seed, hoặc đổi mật khẩu bằng SQL.');
    }
  }

  await bulkInsert('categories', sapXepChaTruoc(snapshot.categories));
  console.log(`✅ categories:          ${snapshot.categories.length}`);

  await bulkInsert('menus', snapshot.menus);
  console.log(`✅ menus:               ${snapshot.menus.length}`);

  await bulkInsert('menu_items', sapXepChaTruoc(snapshot.menuItems));
  console.log(`✅ menu_items:          ${snapshot.menuItems.length}`);

  await bulkInsert('posts', snapshot.posts);
  console.log(`✅ posts:               ${snapshot.posts.length}`);

  await bulkInsert('site_settings', snapshot.siteSettings);
  console.log(`✅ site_settings:       ${snapshot.siteSettings.length}`);

  await bulkInsert('media', snapshot.media);
  console.log(`✅ media:               ${snapshot.media.length}`);

  await bulkInsert('contact_submissions', snapshot.contactSubmissions);
  console.log(`✅ contact_submissions: ${snapshot.contactSubmissions.length}`);

  // Reset sequence để các bản ghi mới (insert sau seed) không bị trùng id.
  for (const t of ['users', 'categories', 'menus', 'menu_items', 'posts', 'media', 'contact_submissions']) {
    await resetSequence(t);
  }
  console.log('✅ Đã reset sequence cho các bảng có SERIAL id');

  await dataSource.destroy();
  console.log('\n🎉 Restore snapshot hoàn tất!');
}

run().catch((err) => {
  console.error('❌ Seed thất bại:', err);
  process.exit(1);
});

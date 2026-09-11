/**
 * Điền focusKeyword cho toàn bộ bài viết rồi chấm điểm SEO hàng loạt.
 *
 *   npm run seo:fill            → chạy thử, KHÔNG ghi gì vào DB
 *   npm run seo:fill -- --apply → ghi focusKeyword + seoScore + seoGrade
 *
 * Điểm số dùng thẳng SeoService của backend nên khớp tuyệt đối với kết quả
 * hiện ra khi lưu bài trong trang quản trị.
 */
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { User } from '../../entities/user.entity';
import { Menu } from '../../entities/menu.entity';
import { MenuItem } from '../../entities/menu-item.entity';
import { Post } from '../../entities/post.entity';
import { SiteSettings } from '../../entities/site-settings.entity';
import { Media } from '../../entities/media.entity';
import { ContactSubmission } from '../../entities/contact-submission.entity';
import { SeoService } from '../../modules/seo/seo.service';

config();

const APPLY = process.argv.includes('--apply');

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

/**
 * Quy tắc lai.
 *
 * Mặc định: lấy tên sản phẩm từ slug (đổi gạch nối thành dấu cách).
 * Cách này vừa khớp đường dẫn vừa khớp tiêu đề cho phần lớn bài viết.
 *
 * Bảng dưới chỉ liệt kê các trường hợp slug KHÁC tên thương hiệu thật:
 * hoặc tiêu đề dùng tên rút gọn (VLC, Firefox), hoặc thương hiệu có dấu
 * chấm mà slug không giữ được (Monday.com, Any.do).
 *
 * Nguyên tắc chọn: ưu tiên từ khoá NGƯỜI THẬT sẽ gõ khi tìm kiếm, chứ không
 * phải từ cho điểm cao nhất. Vì vậy một số bài chấp nhận mất 7 điểm ở mục
 * khớp tiêu đề hoặc khớp đường dẫn — đổi lại bảng điểm phản ánh đúng sự thật.
 */
const TU_KHOA_RIENG: Record<string, string> = {
  // Tên thương hiệu có dấu chấm hoặc gạch nối: slug đổi chúng thành dấu cách
  // nên từ khoá suy ra không khớp chữ nào trong bài, phải khai tay.
  'fpt-einvoice': 'fpt.einvoice',
  'fpt-econtract': 'fpt.econtract',
  'viettel-ca': 'viettel-ca',
  'base-vn': 'base.vn',
  'efy-ca': 'efy-ca',
  'fpt-esign': 'fpt.esign',
  'sap-s4hana': 'sap s/4hana',
  // Bài viết gọi thương hiệu bằng tên ngắn, từ khoá phải theo cách gọi đó
  'bravo-erp': 'bravo',
  'power-bi': 'power bi',
  'looker-studio': 'looker studio',
  // Tiêu đề dùng tên rút gọn — tên ngắn vẫn là từ khoá tốt
  'google-keyword-planner': 'keyword planner',
  'adobe-premiere-pro': 'premiere pro',
  'adobe-after-effects': 'after effects',
  'vlc-media-player': 'vlc',
  'mozilla-firefox': 'firefox',
  'duckduckgo-browser': 'duckduckgo',
  'monday-com': 'monday',
  'otter-ai': 'otter',
  'fireflies-ai': 'fireflies',
  'systeme-io': 'systeme',
  'krea-ai': 'krea',
  'veed-ai': 'veed',
  'notepad-plus-plus': 'notepad',
  'keywordtool-io': 'keywordtool',
  'nhanh-vn': 'nhanh',
  'remove-bg': 'remove',

  // Giữ nguyên tên thương hiệu đầy đủ, kể cả khi mất điểm ở một mục
  'you-com': 'you.com',
  'any-do': 'any.do',
  'character-ai': 'character.ai',
  'beautiful-ai': 'beautiful.ai',
  'copy-ai': 'copy.ai',
  'visual-studio-code': 'visual studio code',
  'pdf-xchange-editor': 'pdf-xchange editor',
  // Bài viết dùng "DALL·E" (dấu chấm giữa) 18 lần, không có dạng "dall-e".
  // Lấy phần gốc thương hiệu để khớp được cả đường dẫn lẫn nội dung thật.
  'dall-e': 'dall',
  '7-zip': '7-zip',

  // Bài /tin-tuc: từ khoá là cụm tiếng Việt có dấu, không suy ra được từ slug.
  // Các bài này chấp nhận mất 7 điểm ở mục "từ khoá trong đường dẫn" — slug
  // phải là chữ không dấu, còn từ khoá thì phải có dấu mới khớp nội dung và
  // mới đúng thứ người đọc gõ khi tìm.
  'chon-cong-cu-ai-tao-anh': 'công cụ ai tạo ảnh',
  '5-loi-viet-prompt-hay-gap': 'viết prompt',
  'quy-trinh-san-xuat-noi-dung-6-buoc': 'quy trình sản xuất nội dung',
  'bo-cong-cu-lam-viec-2026': 'bộ công cụ làm việc',
  'quy-trinh-lam-video-ngan-5-cong-cu': 'quy trình làm video ngắn',
  'ko-fi': 'ko-fi',
  'cpu-z': 'cpu-z',
  'gpu-z': 'gpu-z',
};

function chonTuKhoa(slug: string): string {
  return TU_KHOA_RIENG[slug] ?? slug.replace(/-/g, ' ');
}

async function main() {
  await dataSource.initialize();
  console.log(APPLY ? '⚙️  CHẾ ĐỘ GHI — sẽ cập nhật DB' : '🔍 CHẠY THỬ — không ghi gì vào DB');

  const repo = dataSource.getRepository(Post);
  const seo = new SeoService(null as never); // analyzeRaw không dùng tới repository

  const posts = await repo
    .createQueryBuilder('p')
    .where('p.content IS NOT NULL')
    .andWhere("p.content <> ''")
    .orderBy('p.slug', 'ASC')
    .getMany();

  console.log(`📄 Tìm thấy ${posts.length} bài có nội dung\n`);

  const ketQua: { slug: string; kw: string; score: number; grade: string }[] = [];

  for (const post of posts) {
    const kw = chonTuKhoa(post.slug);
    const r = seo.analyzeRaw({
      focusKeyword: kw,
      title: post.title || '',
      slug: post.slug || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      content: post.content || '',
      thumbnail: post.thumbnail || post.logoUrl || '',
    });

    ketQua.push({ slug: post.slug, kw, score: r.score, grade: r.grade });

    if (APPLY) {
      // Dùng SQL thuần, KHÔNG dùng repo.update(): Post có @UpdateDateColumn nên
      // repo.update() sẽ đẩy updatedAt lên hiện tại. Sitemap lấy updatedAt làm
      // lastModified, làm Google tưởng cả 423 bài vừa sửa — trong khi đây chỉ là
      // dữ liệu quản trị nội bộ, nội dung bài không đổi chữ nào.
      await dataSource.query(
        `UPDATE posts SET "focusKeyword" = $1, "seoScore" = $2, "seoGrade" = $3 WHERE id = $4`,
        [kw, r.score, r.grade, post.id],
      );
    }
  }

  // ── Thống kê ────────────────────────────────────────────────────────────
  const diem = ketQua.map((r) => r.score);
  const tb = diem.reduce((a, b) => a + b, 0) / diem.length;
  const dem = (g: string) => ketQua.filter((r) => r.grade === g).length;

  console.log('══════════ TỔNG QUAN ══════════');
  console.log(`  Điểm trung bình : ${tb.toFixed(1)}/100`);
  console.log(`  Cao nhất        : ${Math.max(...diem)}`);
  console.log(`  Thấp nhất       : ${Math.min(...diem)}`);
  console.log(`  Xếp loại good   : ${dem('good')} bài  (≥70đ)`);
  console.log(`  Xếp loại ok     : ${dem('ok')} bài  (40–69đ)`);
  console.log(`  Xếp loại poor   : ${dem('poor')} bài  (<40đ)`);

  const yeu = [...ketQua].sort((a, b) => a.score - b.score).slice(0, 15);
  console.log('\n══════════ 15 BÀI ĐIỂM THẤP NHẤT ══════════');
  for (const r of yeu) {
    console.log(`  ${String(r.score).padStart(3)}đ  ${r.grade.padEnd(5)}  ${r.slug.padEnd(26)} kw="${r.kw}"`);
  }

  const manh = [...ketQua].sort((a, b) => b.score - a.score).slice(0, 5);
  console.log('\n══════════ 5 BÀI ĐIỂM CAO NHẤT ══════════');
  for (const r of manh) {
    console.log(`  ${String(r.score).padStart(3)}đ  ${r.grade.padEnd(5)}  ${r.slug.padEnd(26)} kw="${r.kw}"`);
  }

  console.log(
    APPLY
      ? `\n✅ Đã cập nhật ${posts.length} bài.`
      : '\n💡 Chạy lại kèm --apply để ghi vào DB.',
  );

  await dataSource.destroy();
}

main().catch((e) => {
  console.error('❌ Lỗi:', e);
  process.exit(1);
});

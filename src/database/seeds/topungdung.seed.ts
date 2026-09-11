/**
 * Seed dữ liệu cho trang chủ TopỨngDụng.
 *
 *   npm run seed:tud
 *
 * Idempotent: chạy lại nhiều lần không nhân bản dữ liệu.
 *  - Danh mục cha "Ứng dụng" (ung-dung) + 6 danh mục con: video, marketing,
 *    ai, sales, creator, design  →  URL công khai /ungdung/<slug>
 *  - Bài viết cho từng ứng dụng, điểm/loại/logo nằm trong productPageConfig.app
 *  - site_settings key "tud-home" chứa toàn bộ chữ của trang chủ
 */
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'news_db',
  synchronize: false,
});

const ROOT_CATEGORY = {
  name: 'Ứng dụng',
  slug: 'ung-dung',
  description: 'Ứng dụng, phần mềm và công cụ AI được xếp hạng trên TopỨngDụng.',
};

/** 6 nhóm nhu cầu — khớp 6 thẻ "Bạn đang muốn làm gì?" trên trang chủ. */
const SUB_CATEGORIES = [
  { slug: 'video', name: 'Video', num: '01 / VIDEO', icon: '🎬', title: 'TÔI MUỐN LÀM VIDEO', description: 'Công cụ dựng phim, cắt ghép, làm short-form và xử lý hậu kỳ.' },
  { slug: 'marketing', name: 'Marketing', num: '02 / MARKETING', icon: '📣', title: 'TÔI MUỐN LÀM MARKETING', description: 'Công cụ quảng cáo, email, SEO và quản lý mạng xã hội.' },
  { slug: 'ai', name: 'AI', num: '03 / AI', icon: '✦', title: 'TÔI MUỐN DÙNG AI', description: 'Trợ lý AI, mô hình ngôn ngữ và công cụ tự động hoá bằng AI.' },
  { slug: 'sales', name: 'Bán hàng', num: '04 / SALES', icon: '💰', title: 'TÔI MUỐN BÁN HÀNG', description: 'CRM, quản lý đơn hàng, chăm sóc khách và bán hàng đa kênh.' },
  { slug: 'creator', name: 'Creator', num: '05 / CREATOR', icon: '▶', title: 'TÔI MUỐN XÂY KÊNH', description: 'Công cụ cho người sáng tạo nội dung: giọng đọc, livestream, quản lý kênh.' },
  { slug: 'design', name: 'Thiết kế', num: '06 / DESIGN', icon: '✏', title: 'TÔI MUỐN THIẾT KẾ', description: 'Thiết kế đồ hoạ, UI, thương hiệu và sinh ảnh bằng AI.' },
  { slug: 'khac', name: 'Ứng dụng khác', num: '07 / KHÁC', icon: '🧩', title: 'TÔI MUỐN XEM THÊM', description: 'Các ứng dụng hữu ích chưa xếp vào nhóm nào ở trên — công cụ văn phòng, tiện ích, quản lý và những thứ hay ho khác.' },
];

interface AppSeed {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  displayOrder: number;
  app: {
    score: number;
    kind: string;
    logoText: string;
    logoBg?: string;
    trend?: string;
    trendUp?: boolean;
    tags?: string[];
  };
}

const APPS: AppSeed[] = [
  // ── VIDEO ──────────────────────────────────────────────────────────────────
  { title: 'CapCut', slug: 'capcut', category: 'video', displayOrder: 1,
    excerpt: 'Video editor cho creator, short-form video và đội ngũ marketing.',
    app: { score: 9.3, kind: 'Video Editor', logoText: 'C', trend: '↑ 4', trendUp: true, tags: ['✓ Free', '✓ Windows', '✓ Mobile', '✓ AI'] } },
  { title: 'Adobe Premiere Pro', slug: 'adobe-premiere-pro', category: 'video', displayOrder: 2,
    excerpt: 'Phần mềm dựng phim chuyên nghiệp, tiêu chuẩn của ngành hậu kỳ.',
    app: { score: 9.0, kind: 'Video Editor', logoText: 'PR', logoBg: 'linear-gradient(135deg,#9999FF,#5C5CE0)', trend: '→', tags: ['✓ Windows', '✓ macOS'] } },
  { title: 'DaVinci Resolve', slug: 'davinci-resolve', category: 'video', displayOrder: 3,
    excerpt: 'Dựng phim và chỉnh màu chuyên sâu, bản miễn phí đã rất mạnh.',
    app: { score: 8.9, kind: 'Video Editor', logoText: 'DR', trend: '↑ 1', trendUp: true, tags: ['✓ Free', '✓ Windows', '✓ macOS'] } },
  { title: 'Descript', slug: 'descript', category: 'video', displayOrder: 4,
    excerpt: 'Sửa video bằng cách sửa phụ đề — hợp với podcast và video nói.',
    app: { score: 8.7, kind: 'Video Editor', logoText: 'DS', trend: '↑ 3', trendUp: true, tags: ['✓ Web', '✓ AI'] } },

  // ── MARKETING ──────────────────────────────────────────────────────────────
  { title: 'Ahrefs', slug: 'ahrefs', category: 'marketing', displayOrder: 1,
    excerpt: 'Bộ công cụ SEO: nghiên cứu từ khoá, phân tích backlink và đối thủ.',
    app: { score: 9.0, kind: 'SEO Tool', logoText: 'AH', logoBg: 'linear-gradient(135deg,#FFC857,#FF9700)', trend: '→', tags: ['✓ Web'] } },
  { title: 'Mailchimp', slug: 'mailchimp', category: 'marketing', displayOrder: 2,
    excerpt: 'Email marketing và automation cho doanh nghiệp vừa và nhỏ.',
    app: { score: 8.5, kind: 'Email Marketing', logoText: 'MC', trend: '↓ 1', tags: ['✓ Free', '✓ Web'] } },
  { title: 'Buffer', slug: 'buffer', category: 'marketing', displayOrder: 3,
    excerpt: 'Lên lịch và quản lý nội dung trên nhiều mạng xã hội cùng lúc.',
    app: { score: 8.4, kind: 'Social Media', logoText: 'BF', trend: '→', tags: ['✓ Free', '✓ Web', '✓ Mobile'] } },
  { title: 'Meta Business Suite', slug: 'meta-business-suite', category: 'marketing', displayOrder: 4,
    excerpt: 'Quản lý trang, quảng cáo và tin nhắn Facebook — Instagram một chỗ.',
    app: { score: 8.6, kind: 'Ads Manager', logoText: 'MB', trend: '↑ 2', trendUp: true, tags: ['✓ Free', '✓ Web', '✓ Mobile'] } },

  // ── AI ─────────────────────────────────────────────────────────────────────
  { title: 'ChatGPT', slug: 'chatgpt', category: 'ai', displayOrder: 1,
    excerpt: 'Trợ lý AI đa năng: viết nội dung, phân tích dữ liệu, lập kế hoạch và hỗ trợ lập trình.',
    app: { score: 9.6, kind: 'AI Assistant', logoText: 'GPT', trend: '↑ 2', trendUp: true, tags: ['✓ Free', '✓ Web', '✓ Mobile', '✓ AI'] } },
  { title: 'Claude', slug: 'claude', category: 'ai', displayOrder: 2,
    excerpt: 'Trợ lý AI mạnh về đọc hiểu tài liệu dài, viết lách và lập luận nhiều bước.',
    app: { score: 9.2, kind: 'AI Assistant', logoText: 'CL', logoBg: 'linear-gradient(135deg,#FFC857,#FF9700)', trend: '↑ 7', trendUp: true, tags: ['✓ Free', '✓ Web', '✓ AI'] } },
  { title: 'Gemini', slug: 'gemini', category: 'ai', displayOrder: 3,
    excerpt: 'Trợ lý AI của Google, gắn chặt với Search, Docs và Gmail.',
    app: { score: 9.0, kind: 'AI Assistant', logoText: 'GM', logoBg: 'linear-gradient(135deg,#29C7F2,#00A8E8)', trend: '↑ 5', trendUp: true, tags: ['✓ Free', '✓ Web', '✓ Mobile', '✓ AI'] } },
  { title: 'Perplexity', slug: 'perplexity', category: 'ai', displayOrder: 4,
    excerpt: 'Công cụ tìm kiếm bằng AI, trả lời kèm nguồn trích dẫn rõ ràng.',
    app: { score: 8.9, kind: 'AI Search', logoText: 'PX', trend: '↑ 6', trendUp: true, tags: ['✓ Free', '✓ Web', '✓ AI'] } },

  // ── SALES ──────────────────────────────────────────────────────────────────
  { title: 'HubSpot CRM', slug: 'hubspot-crm', category: 'sales', displayOrder: 1,
    excerpt: 'CRM miễn phí cho SME: quản lý lead, pipeline và chăm sóc khách hàng.',
    app: { score: 9.1, kind: 'CRM', logoText: 'HS', logoBg: 'linear-gradient(135deg,#FFC857,#FF9700)', trend: '↑ 1', trendUp: true, tags: ['✓ Free', '✓ Web', '✓ Mobile'] } },
  { title: 'Salesforce', slug: 'salesforce', category: 'sales', displayOrder: 2,
    excerpt: 'Nền tảng CRM doanh nghiệp, tuỳ biến sâu cho quy trình bán hàng lớn.',
    app: { score: 8.8, kind: 'CRM', logoText: 'SF', logoBg: 'linear-gradient(135deg,#29C7F2,#00A8E8)', trend: '→', tags: ['✓ Web'] } },
  { title: 'KiotViet', slug: 'kiotviet', category: 'sales', displayOrder: 3,
    excerpt: 'Phần mềm quản lý bán hàng phổ biến tại Việt Nam cho cửa hàng và chuỗi.',
    app: { score: 8.4, kind: 'POS', logoText: 'KV', trend: '↑ 2', trendUp: true, tags: ['✓ Web', '✓ Mobile'] } },
  { title: 'Zalo OA', slug: 'zalo-oa', category: 'sales', displayOrder: 4,
    excerpt: 'Kênh chăm sóc và bán hàng qua Zalo — gần như bắt buộc ở thị trường Việt.',
    app: { score: 8.5, kind: 'Messaging', logoText: 'ZL', logoBg: 'linear-gradient(135deg,#29C7F2,#006FE6)', trend: '↑ 4', trendUp: true, tags: ['✓ Free', '✓ Mobile'] } },

  // ── CREATOR ────────────────────────────────────────────────────────────────
  { title: 'ElevenLabs', slug: 'elevenlabs', category: 'creator', displayOrder: 1,
    excerpt: 'Tạo giọng đọc AI tự nhiên, hỗ trợ tiếng Việt, dùng cho video và podcast.',
    app: { score: 9.1, kind: 'AI Voice', logoText: '11', trend: '↓ 1', tags: ['✓ Web', '✓ AI'] } },
  // Notion đã chuyển sang tonghop/van-phong (cạnh Obsidian, Evernote) vì nó là
  // công cụ văn phòng đa năng, không phải công cụ riêng cho creator. Trước đây
  // nó là bài DUY NHẤT gắn thẳng vào danh mục cấp 2 trên toàn site.
  { title: 'Notion', slug: 'notion', category: 'van-phong', displayOrder: 2,
    excerpt: 'Ghi chú, quản lý dự án và xây kho nội dung cho cả đội sáng tạo.',
    app: { score: 9.0, kind: 'Productivity', logoText: 'NO', trend: '→', tags: ['✓ Free', '✓ Web', '✓ Mobile'] } },
  { title: 'YouTube Studio', slug: 'youtube-studio', category: 'creator', displayOrder: 3,
    excerpt: 'Xuất bản, phân tích và tối ưu kênh YouTube ngay trên nền tảng.',
    app: { score: 8.8, kind: 'Channel Manager', logoText: 'YT', logoBg: 'linear-gradient(135deg,#FF6B6B,#E1306C)', trend: '→', tags: ['✓ Free', '✓ Web', '✓ Mobile'] } },
  { title: 'OBS Studio', slug: 'obs-studio', category: 'creator', displayOrder: 4,
    excerpt: 'Phần mềm livestream và quay màn hình miễn phí, mã nguồn mở.',
    app: { score: 8.7, kind: 'Streaming', logoText: 'OBS', trend: '↑ 1', trendUp: true, tags: ['✓ Free', '✓ Windows', '✓ macOS'] } },

  // ── DESIGN ─────────────────────────────────────────────────────────────────
  { title: 'Figma', slug: 'figma', category: 'design', displayOrder: 1,
    excerpt: 'Thiết kế giao diện và làm việc nhóm trực tiếp trên trình duyệt.',
    app: { score: 9.5, kind: 'UI Design', logoText: 'FG', logoBg: 'linear-gradient(135deg,#FF7262,#A259FF)', trend: '↑ 3', trendUp: true, tags: ['✓ Free', '✓ Web', '✓ macOS'] } },
  { title: 'Canva', slug: 'canva', category: 'design', displayOrder: 2,
    excerpt: 'Nền tảng thiết kế trực tuyến cho thumbnail, ấn phẩm mạng xã hội và tài liệu thương hiệu.',
    app: { score: 9.4, kind: 'Design Platform', logoText: 'CA', logoBg: 'linear-gradient(135deg,#29C7F2,#00A8E8)', trend: '→', tags: ['✓ Free', '✓ Web', '✓ Mobile'] } },
  { title: 'Midjourney', slug: 'midjourney', category: 'design', displayOrder: 3,
    excerpt: 'Sinh ảnh bằng AI với chất lượng thẩm mỹ cao, hợp làm ảnh concept.',
    app: { score: 9.0, kind: 'AI Image', logoText: 'MJ', trend: '↑ 2', trendUp: true, tags: ['✓ Web', '✓ AI'] } },
  { title: 'Adobe Express', slug: 'adobe-express', category: 'design', displayOrder: 4,
    excerpt: 'Thiết kế nhanh ấn phẩm mạng xã hội, có sẵn template và công cụ AI.',
    app: { score: 8.6, kind: 'Design Platform', logoText: 'AE', logoBg: 'linear-gradient(135deg,#FF61F6,#FF0000)', trend: '↑ 1', trendUp: true, tags: ['✓ Free', '✓ Web', '✓ Mobile', '✓ AI'] } },
];

const TUD_HOME = {
  header: {
    brandTop: 'TOP',
    brandRest: 'ỨNGDỤNG',
    brandSuffix: 'net',
    links: [
      { label: 'Khám phá', href: '#discover' },
      { label: 'Bảng xếp hạng', href: '#ranking' },
      { label: 'So sánh', href: '#compare' },
      { label: 'Bộ công cụ', href: '/topapp' },
      { label: 'Review', href: '#review' },
    ],
    searchText: 'Tìm kiếm',
    suggestText: '+ Đề xuất ứng dụng',
  },
  hero: {
    eyebrow: '12.840+ công cụ đang được khám phá',
    line1: 'TÌM ĐÚNG',
    line2: 'ỨNG DỤNG',
    line3: 'LÀM VIỆC TỐT HƠN',
    description:
      'Khám phá, so sánh và lựa chọn những ứng dụng, phần mềm và công cụ AI phù hợp nhất với đúng nhu cầu của bạn.',
    searchPlaceholder: 'Ví dụ: "Tôi muốn tạo video bán hàng bằng AI..."',
    searchButton: 'Tìm công cụ →',
    chips: ['🎥 Tạo Video', 'AI Voice', 'Marketing', 'YouTube', 'SEO', 'Thiết kế'],
  },
  trending: { hidden: false, label: 'TRENDING NOW →' },
  discover: {
    hidden: false,
    eyebrow: 'KHÁM PHÁ THEO NHU CẦU',
    heading: 'Bạn đang muốn làm gì?',
    description: 'Đừng tìm theo tên phần mềm. Hãy bắt đầu từ việc bạn thực sự muốn hoàn thành.',
    cards: SUB_CATEGORIES.map((s) => ({
      num: s.num,
      icon: s.icon,
      title: s.title,
      categorySlug: s.slug,
      countText: '',
      href: '',
    })),
  },
  picks: {
    hidden: false,
    eyebrow: 'TOP PICKS',
    heading: 'Được chọn nhiều tuần này.',
    description: 'Những công cụ nổi bật dựa trên tính hữu ích, trải nghiệm, mức độ phổ biến và giá trị sử dụng.',
    featuredSlug: 'capcut',
    featuredCta: 'Xem review →',
    miniSlugs: ['chatgpt', 'canva', 'claude', 'elevenlabs'],
  },
  stack: {
    hidden: false,
    eyebrow: 'TOP STACK',
    heading1: 'CREATOR',
    heading2: 'STACK.',
    description: 'Một bộ công cụ hoàn chỉnh dành cho người xây kênh: từ ý tưởng → voice → edit → thiết kế → đăng tải.',
    ctaText: 'Xem bộ công cụ →',
    steps: [
      { slug: 'chatgpt', note: 'Viết kịch bản' },
      { slug: 'elevenlabs', note: 'Tạo giọng đọc' },
      { slug: 'capcut', note: 'Chỉnh sửa video' },
      { slug: 'canva', note: 'Thumbnail & visual' },
      { slug: 'youtube-studio', note: 'Xuất bản & phân tích' },
    ],
  },
  battle: {
    hidden: false,
    eyebrow: 'APP BATTLE',
    heading: 'Đặt lên bàn cân.',
    description: 'So sánh trực diện theo nhu cầu thực tế thay vì chỉ nhìn danh sách tính năng.',
    leftSlug: 'capcut',
    rightSlug: 'canva',
    ctaPrefix: 'Chọn',
  },
  ranking: {
    hidden: false,
    eyebrow: 'TOPỨNGDỤNG 100',
    heading: 'Bảng xếp hạng công cụ.',
    description: 'Một bảng xếp hạng duy nhất để người dùng nhanh chóng biết công cụ nào đang đáng dùng nhất.',
    filters: ['Tất cả', 'AI', 'Video', 'Marketing', 'Business', 'Free'],
    limit: 5,
  },
  edit: {
    hidden: false,
    eyebrow: 'THE EDIT',
    heading: 'Đọc ít hơn. Chọn đúng hơn.',
    description: 'Nội dung biên tập theo phong cách tạp chí công nghệ: review, so sánh, top list và hướng dẫn.',
    featuredSlug: '',
    featuredMeta: 'THE BIG LIST · 12 PHÚT ĐỌC',
    listSlugs: [] as string[],
    categorySlug: 'tin-tuc',
  },
  aiFinder: {
    hidden: false,
    eyebrow: '✦ TOP AI FINDER',
    heading: 'KHÔNG BIẾT CHỌN ỨNG DỤNG NÀO?',
    description:
      'Nói cho TopỨngDụng biết bạn muốn làm gì. Hệ thống sẽ gợi ý bộ công cụ phù hợp, chi phí dự kiến và cách kết hợp chúng.',
    placeholder: 'Ví dụ: Tôi bán hàng TikTok và muốn tạo 10 video mỗi ngày...',
    buttonText: '✦ Tìm công cụ cho tôi',
    emptyText: 'Nhập nhu cầu của bạn để nhận gợi ý.',
    resultLabel: 'Gợi ý demo:',
    resultBody: 'ChatGPT → ElevenLabs → CapCut → Canva.',
    resultNote: 'Bản production có thể dùng AI để cá nhân hóa theo ngân sách, nền tảng và mục tiêu.',
  },
  footer: {
    tagline: 'Tìm đúng công cụ cho đúng công việc.',
    columns: [
      { title: 'KHÁM PHÁ', links: SUB_CATEGORIES.slice(0, 4).map((s) => ({ label: s.name, href: `/ungdung/${s.slug}` })) },
      { title: 'NỘI DUNG', links: [{ label: 'Top 100', href: '/ungdung' }, { label: 'Review', href: '/tin-tuc' }, { label: 'So sánh', href: '/#compare' }, { label: 'Bộ công cụ', href: '/#stack' }] },
      { title: 'TOPỨNGDỤNG', links: [{ label: 'Giới thiệu', href: '/introduction' }, { label: 'Đề xuất ứng dụng', href: '/lien-he' }, { label: 'Liên hệ', href: '/lien-he' }, { label: 'Điều khoản', href: '/dieu-khoan-su-dung' }] },
    ],
  },
};

async function main() {
  await dataSource.initialize();
  console.log('📦 Kết nối DB thành công');

  // ─── 1. Danh mục cha ───────────────────────────────────────────────────────
  await dataSource.query(
    `INSERT INTO "categories" ("name","slug","description","status")
     VALUES ($1,$2,$3,'active')
     ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name"`,
    [ROOT_CATEGORY.name, ROOT_CATEGORY.slug, ROOT_CATEGORY.description],
  );
  const [root] = await dataSource.query(`SELECT id FROM "categories" WHERE "slug" = $1`, [ROOT_CATEGORY.slug]);
  console.log(`✅ Danh mục cha "${ROOT_CATEGORY.name}" (id=${root.id})`);

  // ─── 2. 6 danh mục con ─────────────────────────────────────────────────────
  const catIdBySlug: Record<string, number> = {};
  for (const s of SUB_CATEGORIES) {
    await dataSource.query(
      `INSERT INTO "categories" ("name","slug","description","parentId","status")
       VALUES ($1,$2,$3,$4,'active')
       ON CONFLICT ("slug") DO UPDATE SET
         "name" = EXCLUDED."name",
         "description" = EXCLUDED."description",
         "parentId" = EXCLUDED."parentId"`,
      [s.name, s.slug, s.description, root.id],
    );
    const [c] = await dataSource.query(`SELECT id FROM "categories" WHERE "slug" = $1`, [s.slug]);
    catIdBySlug[s.slug] = c.id;
    console.log(`   └─ ${s.slug.padEnd(10)} (id=${c.id})`);
  }

  // ─── 3. Bài viết ứng dụng ──────────────────────────────────────────────────
  const [author] = await dataSource.query(`SELECT id FROM "users" ORDER BY id LIMIT 1`);

  for (const a of APPS) {
    await dataSource.query(
      `INSERT INTO "posts"
         ("title","slug","excerpt","content","categoryId","authorId","status","publishedAt",
          "seoTitle","seoDescription","displayOrder","shortName","productPageConfig")
       VALUES ($1,$2,$3,$4,$5,$6,'published',NOW(),$7,$8,$9,$10,$11::jsonb)
       ON CONFLICT ("slug") DO UPDATE SET
         "excerpt"           = EXCLUDED."excerpt",
         "categoryId"        = EXCLUDED."categoryId",
         "displayOrder"      = EXCLUDED."displayOrder",
         "shortName"         = EXCLUDED."shortName",
         "productPageConfig" = COALESCE("posts"."productPageConfig", '{}'::jsonb)
                               || EXCLUDED."productPageConfig"`,
      [
        a.title,
        a.slug,
        a.excerpt,
        `<p>${a.excerpt}</p>`,
        catIdBySlug[a.category],
        author?.id ?? null,
        `${a.title} — đánh giá, tính năng và ai nên dùng`,
        a.excerpt,
        a.displayOrder,
        a.title,
        JSON.stringify({ app: a.app }),
      ],
    );
  }
  console.log(`✅ ${APPS.length} ứng dụng trong 6 danh mục`);

  // ─── 4. Config trang chủ ───────────────────────────────────────────────────
  // Mặc định KHÔNG ghi đè để giữ nội dung admin đã sửa.
  // Dùng `npm run seed:tud -- --force-config` khi muốn đưa về bản gốc.
  const FORCE_CONFIG = process.argv.includes('--force-config');
  await dataSource.query(
    `INSERT INTO "site_settings" ("key","value")
     VALUES ('tud-home', $1::jsonb)
     ON CONFLICT ("key") DO ${FORCE_CONFIG ? 'UPDATE SET "value" = EXCLUDED."value"' : 'NOTHING'}`,
    [JSON.stringify(TUD_HOME)],
  );
  console.log(`✅ site_settings: tud-home${FORCE_CONFIG ? ' (đã ghi đè)' : ' (giữ nguyên bản đang có)'}`);

  // ─── 5. Tổng kết ───────────────────────────────────────────────────────────
  const rows = await dataSource.query(
    `SELECT c.slug, COUNT(p.id)::int AS n
       FROM "categories" c
       LEFT JOIN "posts" p ON p."categoryId" = c.id AND p."deletedAt" IS NULL
      WHERE c."parentId" = $1
      GROUP BY c.slug ORDER BY c.slug`,
    [root.id],
  );
  console.log('\n📊 Số ứng dụng mỗi danh mục:');
  rows.forEach((r: { slug: string; n: number }) => console.log(`   /ungdung/${r.slug.padEnd(10)} ${r.n}`));

  await dataSource.destroy();
  console.log('\n🎉 Seed TopỨngDụng hoàn tất!');
}

main().catch((err) => {
  console.error('❌ Seed thất bại:', err);
  process.exit(1);
});

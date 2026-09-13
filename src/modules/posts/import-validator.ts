/**
 * Kiểm chuẩn bài viết trước khi nạp.
 *
 * Chuyển nguyên luật từ script `import-article.py` đã dùng để dựng 443 bài hiện
 * có. Giữ đúng từng ngưỡng, không nới lỏng — nếu nới thì các bài mới sẽ mỏng
 * dần so với bài cũ mà không ai nhận ra.
 */

export interface ImportAppMeta {
  /** Điểm tổng 0–10, hiện thành số lớn trên trang chi tiết */
  score?: number;
  /** Nhãn loại: "AI Agent", "Video Editor"... */
  kind?: string;
  /** Câu chốt ngắn dưới tên sản phẩm */
  tagline?: string;
  /** Chữ trong ô logo khi chưa có ảnh */
  logoText?: string;
  /** Trang chủ sản phẩm */
  website?: string;
  /** Nền tảng hỗ trợ */
  platforms?: string[];
  pricingSummary?: string;
  ctaText?: string;
  languages?: string;
  pros?: string[];
  cons?: string[];
  bestFor?: string[];
  verdict?: string;
  scoreBreakdown?: { label: string; value: number }[];
  [k: string]: unknown;
}

export interface ImportItem {
  slug: string;
  /** Bắt buộc khi tạo bài mới; bỏ qua khi cập nhật bài đã có */
  title?: string;
  /** Slug danh mục, bắt buộc khi tạo bài mới */
  categorySlug?: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords?: string;
  excerpt?: string;
  /** Logo đã nằm trên máy chủ ("/uploads/<tệp>.webp") — agent đăng bài tải qua /media/import-url trước rồi ghi vào đây */
  logoUrl?: string;
  thumbnail?: string;
  app?: ImportAppMeta;
  faq?: { q: string; a: string }[];
}

export interface ItemReport {
  slug: string;
  errors: string[];
  stats: {
    words: number;
    h2: number;
    h3: number;
    tables: number;
    links: number;
    faq: number;
  };
}

/** Đếm từ sau khi bóc hết thẻ HTML — cùng cách script cũ đếm. */
function countWords(html: string): number {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

function countAll(html: string, re: RegExp): number {
  return (html.match(re) || []).length;
}

export function validateItem(item: ImportItem): ItemReport {
  const errors: string[] = [];
  const html = item.content ?? '';

  const words = countWords(html);
  const h2 = countAll(html, /<h2[\s>]/gi);
  const h3 = countAll(html, /<h3[\s>]/gi);
  const tables = countAll(html, /<table[\s>]/gi);
  const links = countAll(html, /href="\//g);
  const faqLen = item.faq?.length ?? 0;

  if (!item.slug) errors.push('thiếu slug');
  if (!html.trim()) errors.push('thiếu nội dung bài');

  if (words < 1200) errors.push(`chỉ ${words} từ, tối thiểu 1200`);
  if (tables < 2) errors.push(`chỉ ${tables} bảng, tối thiểu 2`);
  if (h2 < 7) errors.push(`chỉ ${h2} mục H2, tối thiểu 7`);
  if (links < 3) errors.push(`chỉ ${links} link nội bộ, tối thiểu 3`);

  if (/<h[1-6][^>]*>\s*Câu hỏi thường gặp/i.test(html)) {
    errors.push('thân bài còn mục "Câu hỏi thường gặp" — trang đã tự render khối FAQ');
  }
  if (/<h1[\s>]/i.test(html)) {
    errors.push('thân bài không được có <h1> (tên bài đã là h1 của trang)');
  }

  // Bậc heading: phải bắt đầu từ h2 và không được nhảy cách
  const levels = [...html.matchAll(/<h([2-6])[\s>]/gi)].map((m) => Number(m[1]));
  if (levels.length && levels[0] !== 2) {
    errors.push(`heading đầu tiên phải là h2, đang là h${levels[0]}`);
  }
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      errors.push(`nhảy bậc heading: h${levels[i - 1]} → h${levels[i]}`);
      break;
    }
  }

  // Thẻ <p> phải cân đối, lệch là bố cục vỡ khi render
  const pOpen = countAll(html, /<p[\s>]/gi);
  const pClose = countAll(html, /<\/p>/gi);
  if (pOpen !== pClose) errors.push(`thẻ <p> lệch: ${pOpen} mở / ${pClose} đóng`);

  if ((item.seoTitle ?? '').length > 60) {
    errors.push(`seoTitle ${item.seoTitle.length} ký tự, tối đa 60`);
  }
  if ((item.seoDescription ?? '').length > 160) {
    errors.push(`seoDescription ${item.seoDescription.length} ký tự, tối đa 160`);
  }

  // Metadata hiển thị ở cột bên phải trang sản phẩm
  const app = item.app ?? {};
  // Danh sách này phải khớp với những gì trang /app/<slug> thật sự render.
  // Bản đầu chỉ bắt 8 trường trong khi trang dùng tới 17, nên bài nạp vào bị
  // thiếu điểm chấm, thiếu nhãn loại và thiếu nút sang trang chủ sản phẩm.
  const required = [
    'score',
    'kind',
    'tagline',
    'logoText',
    'website',
    'platforms',
    'pricingSummary',
    'ctaText',
    'languages',
    'pros',
    'cons',
    'bestFor',
    'verdict',
    'scoreBreakdown',
  ];
  const missing = required.filter((k) => {
    const v = app[k];
    return Array.isArray(v) ? v.length === 0 : !v;
  });
  if (missing.length) errors.push(`thiếu metadata: ${missing.join(', ')}`);

  const score = Number(app.score);
  if (app.score !== undefined && (!Number.isFinite(score) || score < 0 || score > 10)) {
    errors.push('score phải là số trong khoảng 0 đến 10');
  }
  if ((app.scoreBreakdown?.length ?? 0) !== 5) {
    errors.push('scoreBreakdown phải có đúng 5 mục');
  }
  for (const k of ['pros', 'cons', 'bestFor'] as const) {
    if ((app[k]?.length ?? 0) < 4) errors.push(`'${k}' phải có ít nhất 4 mục`);
  }
  if (faqLen < 9) errors.push('FAQ phải có ít nhất 9 câu');

  return { slug: item.slug, errors, stats: { words, h2, h3, tables, links, faq: faqLen } };
}

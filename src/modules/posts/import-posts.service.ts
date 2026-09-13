import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { Post, PostStatus } from '../../entities/post.entity';
import { ImportItem, ItemReport, validateItem } from './import-validator';

export interface ImportResult {
  /** true khi chỉ kiểm tra, không ghi gì vào cơ sở dữ liệu */
  dryRun: boolean;
  total: number;
  passed: number;
  failed: number;
  created: number;
  updated: number;
  reports: (ItemReport & {
    action: 'tạo mới' | 'cập nhật' | 'bỏ qua';
    /** Đường dẫn công khai của bài, để bấm sang xem ngay sau khi nạp */
    url?: string;
    /** Các câu văn trùng với bài đã đăng */
    duplicates?: { sentence: string; withSlug: string }[];
  })[];
}

/** Tách câu để so trùng. Bỏ thẻ HTML, cắt theo dấu chấm và xuống dòng. */
function toSentences(html: string): string[] {
  return html
    // Thẻ khối đóng lại là hết một câu — không thì tiêu đề "Cách dùng để có
    // kết quả tốt" dính vào "1." của h3 kế tiếp thành một câu 8 từ giống nhau
    // ở mọi bài, và bài nào cũng bị báo trùng với bài trước.
    .replace(/<\/(h[1-6]|p|li|td|th|tr|div|blockquote)>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    // Đã gộp mọi khoảng trắng ở trên nên chỉ cần cắt theo dấu kết câu.
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim().toLowerCase().replace(/[.,!?;:"'()\[\]]/g, ''))
    // Câu quá ngắn hay trùng ngẫu nhiên (ví dụ "Miễn phí"), bỏ qua để giảm nhiễu
    .filter((x) => x.split(' ').length >= 8);
}

/**
 * Nạp bài viết từ tệp JSON soạn sẵn.
 *
 * Cách trình bày bài của site này (khối trả lời nhanh, 3 bảng so sánh, 8 mục H2,
 * 9 câu hỏi đáp) không dựng được bằng trình soạn thảo thông thường. Nên quy trình
 * là: soạn ngoài, xuất ra JSON, nạp qua đây — và cổng kiểm chuẩn chặn mọi bài
 * không đạt, giống hệt script đã dùng cho 443 bài hiện có.
 */
@Injectable()
export class ImportPostsService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Category) private catRepo: Repository<Category>,
  ) {}

  async run(items: ImportItem[], dryRun: boolean): Promise<ImportResult> {
    if (!Array.isArray(items) || !items.length) {
      throw new BadRequestException('Tệp không có mục nào để nạp');
    }
    if (items.length > 100) {
      throw new BadRequestException('Tối đa 100 bài mỗi lần nạp');
    }

    const slugs = items.map((i) => i.slug).filter(Boolean);
    const dup = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    if (dup.length) {
      throw new BadRequestException(`Slug lặp trong tệp: ${[...new Set(dup)].join(', ')}`);
    }

    // Nạp sẵn câu văn của MỌI bài đã đăng, một lần cho cả đợt. Site hiện có
    // hơn 460 bài; truy vấn lại cho từng bài sẽ chậm gấp nhiều lần.
    const published = await this.postRepo
      .createQueryBuilder('p')
      .select(['p.slug', 'p.content'])
      .where('p.content IS NOT NULL')
      .andWhere("p.content <> ''")
      .getMany();

    const sentenceOwner = new Map<string, string>();
    for (const p of published) {
      for (const sen of toSentences(p.content ?? '')) {
        if (!sentenceOwner.has(sen)) sentenceOwner.set(sen, p.slug);
      }
    }

    const result: ImportResult = {
      dryRun,
      total: items.length,
      passed: 0,
      failed: 0,
      created: 0,
      updated: 0,
      reports: [],
    };

    for (const item of items) {
      const report = validateItem(item);
      const existing = item.slug
        ? await this.postRepo.findOne({ where: { slug: item.slug } })
        : null;

      // Bài mới bắt buộc có tiêu đề và danh mục; bài cũ thì giữ nguyên thứ đã có.
      let category: Category | null = null;
      if (!existing) {
        if (!item.title) report.errors.push('bài mới cần có "title"');
        if (!item.categorySlug) {
          report.errors.push('bài mới cần có "categorySlug"');
        } else {
          category = await this.catRepo.findOne({ where: { slug: item.categorySlug } });
          if (!category) report.errors.push(`không có danh mục "${item.categorySlug}"`);
        }
      }

      // So trùng với bài đã đăng. Bỏ qua chính bài đang cập nhật, nếu không
      // mọi câu của nó đều bị báo trùng với chính nó.
      const duplicates: { sentence: string; withSlug: string }[] = [];
      for (const sen of toSentences(item.content ?? '')) {
        const owner = sentenceOwner.get(sen);
        if (owner && owner !== item.slug) {
          duplicates.push({ sentence: sen.slice(0, 120), withSlug: owner });
          if (duplicates.length >= 5) break;
        }
      }
      if (duplicates.length) {
        report.errors.push(
          `trùng ${duplicates.length} câu với bài đã đăng: ${[
            ...new Set(duplicates.map((d) => d.withSlug)),
          ].join(', ')}`,
        );
      }

      if (report.errors.length) {
        result.failed++;
        result.reports.push({ ...report, action: 'bỏ qua', duplicates });
        continue;
      }

      result.passed++;
      const action = existing ? 'cập nhật' : 'tạo mới';
      // Ứng dụng đi theo /app/<slug>; các danh mục khác dùng đường riêng của chúng.
      const url = `/app/${item.slug}`;
      result.reports.push({ ...report, action, url });

      if (dryRun) continue;

      // Gộp metadata vào productPageConfig.app, giữ lại các khoá cũ không khai lại.
      const prevCfg = (existing?.productPageConfig ?? {}) as Record<string, unknown>;
      const prevApp = (prevCfg.app ?? {}) as Record<string, unknown>;
      const productPageConfig = {
        ...prevCfg,
        app: { ...prevApp, ...(item.app ?? {}), faq: item.faq ?? [] },
      };

      if (existing) {
        Object.assign(existing, {
          content: item.content,
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
          seoKeywords: item.seoKeywords ?? existing.seoKeywords,
          excerpt: item.excerpt ?? existing.excerpt,
          logoUrl: item.logoUrl ?? existing.logoUrl,
          thumbnail: item.thumbnail ?? existing.thumbnail,
          productPageConfig,
        });
        await this.postRepo.save(existing);
        result.updated++;
      } else {
        await this.postRepo.save(
          this.postRepo.create({
            slug: item.slug,
            title: item.title!,
            categoryId: category!.id,
            content: item.content,
            seoTitle: item.seoTitle,
            seoDescription: item.seoDescription,
            seoKeywords: item.seoKeywords,
            excerpt: item.excerpt,
            logoUrl: item.logoUrl,
            thumbnail: item.thumbnail,
            productPageConfig,
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(),
          }),
        );
        result.created++;
      }
    }

    return result;
  }
}

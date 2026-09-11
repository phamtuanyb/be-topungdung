import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { generateSlug } from '../../common/utils/slug.util';
import { Category } from '../../entities/category.entity';
import { Post, PostStatus } from '../../entities/post.entity';
import { User } from '../../entities/user.entity';
import { SeoService } from '../seo/seo.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto, SortBy, SortOrder } from './dto/query-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const DEFAULT_CATEGORY_SLUG = 'tin-tuc';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    private seoService: SeoService,
  ) {}

  // ─── TÌM KIẾM ─────────────────────────────────────────────────────────────

  /**
   * Gom các trường mô tả một ứng dụng thành một chuỗi để dò từ khoá.
   * `unaccent` cho phép gõ không dấu ("hop truc tuyen") vẫn ra kết quả.
   */
  private static readonly S_TITLE = `unaccent(lower(
    coalesce(post.title,'') || ' ' || coalesce(post."shortName",'')
  ))`;

  /** Từ khoá SEO là nơi mô tả chủ đề sát nhất, nên được tính điểm cao. */
  private static readonly S_KEYS = `unaccent(lower(
    coalesce(post."seoKeywords",'') || ' ' || coalesce(post."focusKeyword",'')
  ))`;

  private static readonly S_META = `unaccent(lower(
    coalesce(post.title,'') || ' ' || coalesce(post."shortName",'') || ' ' ||
    coalesce(post.excerpt,'') || ' ' || coalesce(post."seoKeywords",'') || ' ' ||
    coalesce(post."focusKeyword",'') || ' ' || coalesce(post."seoDescription",'') || ' ' ||
    coalesce(category.name,'') || ' ' ||
    coalesce(post."productPageConfig"->'app'->>'tagline','') || ' ' ||
    coalesce(post."productPageConfig"->'app'->>'kind','')
  ))`;

  private static readonly S_BODY = `unaccent(lower(coalesce(post.content,'')))`;

  /**
   * Từ đồng nghĩa, khoá viết KHÔNG DẤU thường.
   *
   * Người Việt tìm "chỉnh sửa video" nhưng bài viết ghi "dựng video" hoặc
   * "Video Editor" — lệch từ vựng khiến CapCut không ra kết quả dù là ứng dụng
   * dựng video phổ biến nhất.
   *
   * Nguyên tắc chọn: chỉ nhận từ KHÔNG bị trùng nghĩa khi bỏ dấu. Ví dụ không
   * dùng "dung" làm từ đồng nghĩa cho "chỉnh sửa", vì bỏ dấu thì "dựng" trùng
   * với "dùng", "sử dụng", "dung lượng" — sẽ khớp bừa hàng loạt bài.
   */
  private static readonly SYNONYMS: Record<string, string[]> = {
    chinh: ['edit'],
    sua: ['edit'],
    diet: ['quet'],
    virus: ['antivirus'],
    khau: ['password'],
    nen: ['zip'],
    hop: ['meeting'],
  };

  /**
   * Tìm theo từ khoá thay vì chỉ khớp tiêu đề.
   *
   * Trước đây chỉ dò `title` và `excerpt`, nên những truy vấn rất đời thường như
   * "nén file", "quản lý mật khẩu", "diệt virus" đều trả về 0 kết quả.
   *
   * Cách làm: tách truy vấn thành từng từ, bài phải chứa ĐỦ mọi từ (ở metadata
   * hoặc trong nội dung) thì mới được lấy. Sau đó xếp theo điểm liên quan —
   * khớp ở tiêu đề đứng trên khớp ở từ khoá, khớp ở nội dung xếp cuối vì rất
   * rộng (riêng "ghi chú" đã xuất hiện trong 420/423 bài).
   */
  private applySearch(
    qb: SelectQueryBuilder<Post>,
    search: string,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ) {
    const { S_TITLE, S_KEYS, S_META, S_BODY } = PostsService;

    // Giới hạn 6 từ: đủ cho mọi truy vấn thật, tránh câu SQL phình vô hạn.
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
    if (!terms.length) return;

    const params: Record<string, string> = { phrase: `%${search}%` };
    const musts: string[] = [];

    terms.forEach((t, i) => {
      params[`t${i}`] = `%${t}%`;

      // Mỗi từ khớp chính nó HOẶC một từ đồng nghĩa. Từ đồng nghĩa tra theo
      // dạng không dấu nên phải bỏ dấu từ khoá trước khi tra bảng.
      const key = t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
      const alts = PostsService.SYNONYMS[key] ?? [];
      const ors = [`${S_META} LIKE unaccent(lower(:t${i}))`];

      alts.forEach((alt, j) => {
        params[`s${i}_${j}`] = `%${alt}%`;
        ors.push(`${S_META} LIKE unaccent(lower(:s${i}_${j}))`);
      });

      musts.push(`(${ors.join(' OR ')})`);
    });

    // Lọc CHỈ theo metadata: bài phải chứa đủ mọi từ trong tiêu đề, từ khoá,
    // mô tả hoặc tên danh mục. Nội dung bài không tham gia lọc.
    //
    // Lý do: tiếng Việt có quá nhiều từ phổ thông ("ghi", "chú", "quản", "lý")
    // nằm rải rác khắp các bài. Khi cho nội dung tham gia lọc, truy vấn "ghi chú"
    // trả về 420/423 bài — tổng số vô nghĩa và trang 2 trở đi toàn rác.
    // Bỏ nội dung ra thì còn 74 bài, và đo trên các truy vấn thật thì không
    // truy vấn nào bị rơi về 0. Nội dung vẫn được dùng để CHẤM ĐIỂM bên dưới.
    qb.andWhere(`(${musts.join(' AND ')})`, params);

    const relevance = [
      `(CASE WHEN ${S_TITLE} LIKE unaccent(lower(:phrase)) THEN 100 ELSE 0 END)`,
      `(CASE WHEN ${S_KEYS}  LIKE unaccent(lower(:phrase)) THEN 50  ELSE 0 END)`,
      `(CASE WHEN ${S_META}  LIKE unaccent(lower(:phrase)) THEN 25  ELSE 0 END)`,
      `(CASE WHEN ${S_BODY}  LIKE unaccent(lower(:phrase)) THEN 5   ELSE 0 END)`,
      // Cộng thêm cho từng từ khớp ở tiêu đề, để truy vấn nhiều từ vẫn xếp đúng.
      ...terms.map(
        (_, i) => `(CASE WHEN ${S_TITLE} LIKE unaccent(lower(:t${i})) THEN 10 ELSE 0 END)`,
      ),
    ].join(' + ');

    qb.addSelect(relevance, 'relevance')
      .orderBy('relevance', 'DESC')
      .addOrderBy(`post.${sortBy}`, sortOrder);
  }

  // ─── PUBLIC ───────────────────────────────────────────────────────────────

  async findPublished(query: QueryPostDto) {
    const {
      page = 1, limit = 10, search, category, categoryId,
      sortBy = SortBy.PUBLISHED_AT, sortOrder = SortOrder.DESC,
    } = query;

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('post.deletedAt IS NULL')
      .select([
        'post.id', 'post.title', 'post.slug', 'post.excerpt',
        'post.thumbnail', 'post.publishedAt', 'post.createdAt', 'post.viewCount',
        'post.seoTitle', 'post.seoDescription', 'post.seoKeywords', 'post.updatedAt',
        'post.logoUrl', 'post.badge', 'post.shortName', 'post.displayOrder', 'post.menuGroupId', 'post.productPageConfig',
        'category.id', 'category.name', 'category.slug',
        'author.id', 'author.fullName',
      ])
      .orderBy(`post.${sortBy}`, sortOrder);

    if (search?.trim()) {
      this.applySearch(qb, search.trim(), sortBy, sortOrder);
    }
    if (category) {
      qb.andWhere('category.slug = :category', { category });
    }
    if (categoryId) {
      qb.andWhere('post.categoryId = :categoryId', { categoryId });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPublishedBySlug(slug: string) {
    const post = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.slug = :slug', { slug })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('post.deletedAt IS NULL')
      .getOne();

    if (!post) throw new NotFoundException('Bài viết không tồn tại hoặc chưa được xuất bản');

    // Tăng view count bất đồng bộ, không ảnh hưởng response.
    // KHÔNG dùng repo.increment(): nó đi qua UpdateQueryBuilder nên tự đặt luôn
    // @UpdateDateColumn, biến `updatedAt` thành "lần cuối có người xem" và làm
    // `lastmod` trong sitemap đổi mỗi lượt truy cập. Câu lệnh thuần chỉ đụng một cột.
    this.postRepo
      .query('UPDATE posts SET "viewCount" = "viewCount" + 1 WHERE id = $1', [post.id])
      .catch(() => {});

    return post;
  }

  async findByCategorySlug(categorySlug: string, query: QueryPostDto) {
    const {
      page = 1, limit = 10, all = false,
      sortBy = SortBy.PUBLISHED_AT, sortOrder = SortOrder.DESC,
    } = query;

    const root = await this.categoryRepo.findOne({ where: { slug: categorySlug } });
    if (!root) throw new NotFoundException('Danh mục không tồn tại');

    const categoryIds = await this.collectCategoryIds(root.id);

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('post.deletedAt IS NULL')
      .andWhere('post.categoryId IN (:...categoryIds)', { categoryIds })
      .select([
        'post.id', 'post.title', 'post.slug', 'post.excerpt',
        'post.thumbnail', 'post.publishedAt', 'post.createdAt', 'post.viewCount',
        'post.logoUrl', 'post.badge', 'post.shortName', 'post.displayOrder', 'post.menuGroupId', 'post.productPageConfig',
        'category.id', 'category.name', 'category.slug',
        'author.id', 'author.fullName',
      ])
      .orderBy(`post.${sortBy}`, sortOrder);

    if (!all) {
      qb.skip((page - 1) * limit).take(limit);
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: all
        ? { total }
        : { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async collectCategoryIds(rootId: number): Promise<number[]> {
    const all = await this.categoryRepo.find({ select: ['id', 'parentId'] });
    const ids: number[] = [];
    const queue = [rootId];
    while (queue.length) {
      const current = queue.shift()!;
      ids.push(current);
      all.filter((c) => c.parentId === current).forEach((c) => queue.push(c.id));
    }
    return ids;
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────────

  async findAllAdmin(query: QueryPostDto) {
    const { page = 1, limit = 20, search, status, categoryId } = query;
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.author', 'author')
      .withDeleted()
      .where('post.deletedAt IS NULL')
      .orderBy('post.createdAt', 'DESC');

    if (search) {
      qb.andWhere('post.title ILIKE :search', { search: `%${search}%` });
    }
    if (status) {
      qb.andWhere('post.status = :status', { status });
    }
    if (categoryId) {
      qb.andWhere('post.categoryId = :categoryId', { categoryId });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneAdmin(id: number) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['category', 'author'],
    });
    if (!post) throw new NotFoundException('Bài viết không tồn tại');
    return post;
  }

  async create(dto: CreatePostDto, author: User) {
    const slug = await this.resolveSlug(dto.slug, dto.title);
    const categoryId = dto.categoryId ?? await this.getDefaultCategoryId();

    const post = this.postRepo.create({
      ...dto,
      slug,
      categoryId,
      authorId: author.id,
      status: dto.status ?? PostStatus.DRAFT,
    });
    const saved = await this.postRepo.save(post);
    return this.computeAndSaveSeoScore(saved);
  }

  async update(id: number, dto: UpdatePostDto) {
    const post = await this.findOneAdmin(id);

    if (dto.slug) {
      dto.slug = generateSlug(dto.slug);
      if (dto.slug !== post.slug) {
        await this.checkSlugUnique(dto.slug, id);
      }
    }

    Object.assign(post, dto);
    const saved = await this.postRepo.save(post);
    return this.computeAndSaveSeoScore(saved);
  }

  async checkSlugAvailable(slug: string, excludeId?: number): Promise<{ available: boolean; slug: string }> {
    const normalized = generateSlug(slug);
    const existing = await this.postRepo.findOne({ where: { slug: normalized } });
    const available = !existing || existing.id === excludeId;
    return { available, slug: normalized };
  }

  private async computeAndSaveSeoScore(post: Post): Promise<Post> {
    const kw = post.focusKeyword?.trim();
    if (!kw) return post;

    const result = this.seoService.analyzeRaw({
      focusKeyword: kw,
      title: post.title || '',
      slug: post.slug || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      content: post.content || '',
      thumbnail: post.thumbnail || '',
    });

    await this.postRepo.update(post.id, { seoScore: result.score, seoGrade: result.grade });
    post.seoScore = result.score;
    post.seoGrade = result.grade;
    return post;
  }

  async publish(id: number) {
    const post = await this.findOneAdmin(id);

    if (!post.title) throw new BadRequestException('Bài viết cần có tiêu đề');
    if (!post.content) throw new BadRequestException('Bài viết cần có nội dung');
    if (!post.categoryId) throw new BadRequestException('Bài viết cần có danh mục');
    if (!post.slug) throw new BadRequestException('Bài viết cần có slug');

    post.status = PostStatus.PUBLISHED;
    if (!post.publishedAt) post.publishedAt = new Date();

    return this.postRepo.save(post);
  }

  async draft(id: number) {
    const post = await this.findOneAdmin(id);
    post.status = PostStatus.DRAFT;
    return this.postRepo.save(post);
  }

  async remove(id: number) {
    const post = await this.findOneAdmin(id);
    return this.postRepo.softRemove(post);
  }

  // ─── PRIVATE ──────────────────────────────────────────────────────────────

  private async getDefaultCategoryId(): Promise<number | undefined> {
    const cat = await this.categoryRepo.findOne({ where: { slug: DEFAULT_CATEGORY_SLUG } });
    return cat?.id;
  }

  private async resolveSlug(slug: string | undefined, title: string): Promise<string> {
    const base = generateSlug(slug || title);
    await this.checkSlugUnique(base);
    return base;
  }

  private async checkSlugUnique(slug: string, excludeId?: number) {
    const existing = await this.postRepo.findOne({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Slug "${slug}" đã tồn tại`);
    }
  }
}

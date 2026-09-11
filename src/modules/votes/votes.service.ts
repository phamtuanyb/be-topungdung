import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { AppVote } from '../../entities/app-vote.entity';
import { Post, PostStatus } from '../../entities/post.entity';

export interface VoteSummary {
  slug: string;
  /** Điểm trung bình 0–5, làm tròn 1 chữ số */
  average: number;
  /** Tổng số phiếu */
  count: number;
  /** Phiếu của chính khách đang xem, null nếu chưa bình chọn */
  myRating: number | null;
  /** Số phiếu theo từng mức sao: [1 sao, 2 sao, 3, 4, 5] */
  distribution: number[];
}

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(AppVote) private voteRepo: Repository<AppVote>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
  ) {}

  /** Nhận diện khách ẩn danh — không lưu IP thô. */
  buildVoterKey(ip: string, userAgent: string): string {
    return createHash('sha256')
      .update(`${ip || 'unknown'}|${userAgent || 'unknown'}`)
      .digest('hex');
  }

  private async findPublishedPost(slug: string): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { slug, status: PostStatus.PUBLISHED },
    });
    if (!post) throw new NotFoundException('Ứng dụng không tồn tại hoặc chưa xuất bản');
    return post;
  }

  /** Bình chọn hoặc đổi phiếu đã bình chọn trước đó. */
  async vote(slug: string, rating: number, voterKey: string): Promise<VoteSummary> {
    const post = await this.findPublishedPost(slug);

    const existing = await this.voteRepo.findOne({
      where: { postId: post.id, voterKey },
    });

    if (existing) {
      existing.rating = rating;
      await this.voteRepo.save(existing);
    } else {
      await this.voteRepo.save(this.voteRepo.create({ postId: post.id, rating, voterKey }));
    }

    return this.summary(slug, voterKey);
  }

  /** Rút lại phiếu. */
  async unvote(slug: string, voterKey: string): Promise<VoteSummary> {
    const post = await this.findPublishedPost(slug);
    await this.voteRepo.delete({ postId: post.id, voterKey });
    return this.summary(slug, voterKey);
  }

  /** Thống kê phiếu của một ứng dụng. */
  async summary(slug: string, voterKey?: string): Promise<VoteSummary> {
    const post = await this.findPublishedPost(slug);

    const rows: { rating: number; n: string }[] = await this.voteRepo
      .createQueryBuilder('v')
      .select('v.rating', 'rating')
      .addSelect('COUNT(*)', 'n')
      .where('v.postId = :id', { id: post.id })
      .groupBy('v.rating')
      .getRawMany();

    const distribution = [0, 0, 0, 0, 0];
    let total = 0;
    let sum = 0;
    for (const r of rows) {
      const n = parseInt(r.n, 10);
      const idx = Number(r.rating) - 1;
      if (idx >= 0 && idx < 5) distribution[idx] = n;
      total += n;
      sum += Number(r.rating) * n;
    }

    let myRating: number | null = null;
    if (voterKey) {
      const mine = await this.voteRepo.findOne({ where: { postId: post.id, voterKey } });
      myRating = mine?.rating ?? null;
    }

    return {
      slug,
      average: total ? Math.round((sum / total) * 10) / 10 : 0,
      count: total,
      myRating,
      distribution,
    };
  }

  /**
   * Thống kê phiếu của tất cả ứng dụng — dùng cho bảng xếp hạng.
   * Trả về map slug → { average, count, mine }.
   * `mine` là phiếu của chính khách đang xem, dùng để tô sáng nút chấm nhanh.
   */
  async summaryAll(
    voterKey?: string,
  ): Promise<Record<string, { average: number; count: number; mine: number | null }>> {
    const rows: { slug: string; avg: string; n: string }[] = await this.voteRepo
      .createQueryBuilder('v')
      .innerJoin('posts', 'p', 'p.id = v."postId"')
      .select('p.slug', 'slug')
      .addSelect('AVG(v.rating)', 'avg')
      .addSelect('COUNT(*)', 'n')
      .where('p."deletedAt" IS NULL')
      .groupBy('p.slug')
      .getRawMany();

    const out: Record<string, { average: number; count: number; mine: number | null }> = {};
    for (const r of rows) {
      out[r.slug] = {
        average: Math.round(parseFloat(r.avg) * 10) / 10,
        count: parseInt(r.n, 10),
        mine: null,
      };
    }

    if (voterKey) {
      const mineRows: { slug: string; rating: number }[] = await this.voteRepo
        .createQueryBuilder('v')
        .innerJoin('posts', 'p', 'p.id = v."postId"')
        .select('p.slug', 'slug')
        .addSelect('v.rating', 'rating')
        .where('v."voterKey" = :voterKey', { voterKey })
        .andWhere('p."deletedAt" IS NULL')
        .getRawMany();
      for (const r of mineRows) {
        if (out[r.slug]) out[r.slug].mine = Number(r.rating);
      }
    }

    return out;
  }

  // ─── ADMIN ──────────────────────────────────────────────────────────────────

  /** Danh sách phiếu gần đây để kiểm duyệt. */
  async findAllAdmin(page = 1, limit = 50) {
    const [data, total] = await this.voteRepo
      .createQueryBuilder('v')
      .innerJoin('posts', 'p', 'p.id = v."postId"')
      .select([
        'v.id AS id',
        'v.rating AS rating',
        'v."voterKey" AS "voterKey"',
        'v."createdAt" AS "createdAt"',
        'p.slug AS "postSlug"',
        'p.title AS "postTitle"',
      ])
      .orderBy('v."createdAt"', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany()
      .then(async (rows) => [rows, await this.voteRepo.count()] as const);

    return {
      data: data.map((r: Record<string, unknown>) => ({
        ...r,
        // Chỉ lộ 8 ký tự đầu để phân biệt, không đủ để truy ngược danh tính
        voterKey: String(r.voterKey).slice(0, 8),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async removeAdmin(id: number): Promise<void> {
    const res = await this.voteRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Phiếu bình chọn không tồn tại');
  }
}

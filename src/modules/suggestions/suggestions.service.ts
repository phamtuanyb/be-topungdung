import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { AppSuggestion, SuggestionKind, SuggestionStatus } from '../../entities/app-suggestion.entity';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectRepository(AppSuggestion) private repo: Repository<AppSuggestion>,
  ) {}

  /** Nhận diện người gửi mà không lưu IP thô. */
  buildSubmitterKey(ip: string, userAgent: string): string {
    return createHash('sha256')
      .update(`${ip || 'unknown'}|${userAgent || 'unknown'}`)
      .digest('hex');
  }

  async create(dto: CreateSuggestionDto, submitterKey: string) {
    const saved = await this.repo.save(
      this.repo.create({
        ...dto,
        kind: dto.kind ?? SuggestionKind.APP,
        submitterKey,
        status: SuggestionStatus.NEW,
      }),
    );
    const msg =
      saved.kind === SuggestionKind.PROMPT
        ? 'Đã gửi prompt. Cảm ơn bạn, bọn mình sẽ xem và đăng lên nếu phù hợp!'
        : 'Đã gửi đề xuất. Cảm ơn bạn!';
    return { id: saved.id, message: msg };
  }

  // ─── ADMIN ──────────────────────────────────────────────────────────────────

  async findAllAdmin(page = 1, limit = 20, status?: SuggestionStatus) {
    const qb = this.repo
      .createQueryBuilder('s')
      .orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.where('s.status = :status', { status });

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Đếm theo trạng thái để hiện huy hiệu "chưa xử lý" trên menu. */
  async countsByStatus(): Promise<Record<string, number>> {
    const rows: { status: string; n: string }[] = await this.repo
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)', 'n')
      .groupBy('s.status')
      .getRawMany();

    const out: Record<string, number> = { new: 0, reviewing: 0, accepted: 0, rejected: 0 };
    for (const r of rows) out[r.status] = parseInt(r.n, 10);
    return out;
  }

  async update(id: number, dto: UpdateSuggestionDto) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Đề xuất không tồn tại');
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Đề xuất không tồn tại');
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettings } from '../../entities/site-settings.entity';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSettings)
    private repo: Repository<SiteSettings>,
  ) {}

  async get(key: string): Promise<object> {
    const row = await this.repo.findOne({ where: { key } });
    if (!row) throw new NotFoundException(`Setting "${key}" không tồn tại`);
    return row.value;
  }

  async upsert(key: string, value: object): Promise<object> {
    await this.repo.upsert({ key, value }, ['key']);
    return value;
  }
}

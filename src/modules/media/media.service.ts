import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import { Repository } from 'typeorm';
import { Media } from '../../entities/media.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media) private mediaRepo: Repository<Media>,
    private configService: ConfigService,
  ) {}

  async saveUpload(
    file: Express.Multer.File,
    metadata?: { altText?: string; caption?: string },
  ): Promise<Media> {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const absUploadDir = path.resolve(uploadDir);
    if (!fs.existsSync(absUploadDir)) {
      fs.mkdirSync(absUploadDir, { recursive: true });
    }

    const filename = `${uuid()}.webp`;
    const filePath = path.join(absUploadDir, filename);
    const isAnimated = file.mimetype === 'image/gif';

    await sharp(file.buffer, { animated: isAnimated })
      .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filePath);

    const stat = fs.statSync(filePath);

    const media = this.mediaRepo.create({
      // Lưu đường dẫn TƯƠNG ĐỐI, không kèm host.
      //
      // Trước đây chỗ này ghép sẵn PUBLIC_URL vào, nên host bị đóng băng vào dữ
      // liệu ngay lúc tải lên: đổi tên miền hay chuyển sang CDN là mọi ảnh cũ
      // chết, phải chạy SQL sửa lại từng dòng. Frontend nhận "/uploads/<tệp>"
      // rồi tự chuyển tiếp về backend qua rewrite trong next.config.
      url: `/uploads/${filename}`,
      fileName: filename,
      mimeType: 'image/webp',
      size: stat.size,
      altText: metadata?.altText ?? null,
      caption: metadata?.caption ?? null,
    });

    return this.mediaRepo.save(media);
  }

  async importFromUrl(
    imageUrl: string,
    metadata?: { altText?: string; caption?: string },
  ): Promise<Media> {
    // Nhiều CDN của nhà phát hành trả 403 cho User-Agent mặc định của Node;
    // xưng là trình duyệt và giới hạn 20 giây để một logo treo không kẹt cả đợt nạp.
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/png,image/*;q=0.8,*/*;q=0.5',
      },
      signal: AbortSignal.timeout(20_000),
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`Không thể tải ảnh: ${res.status} ${res.statusText}`);

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      throw new Error('URL không phải ảnh hợp lệ');
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const absUploadDir = path.resolve(uploadDir);
    if (!fs.existsSync(absUploadDir)) fs.mkdirSync(absUploadDir, { recursive: true });

    const filename = `${uuid()}.webp`;
    const filePath = path.join(absUploadDir, filename);

    await sharp(buffer)
      .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filePath);

    const stat = fs.statSync(filePath);

    const media = this.mediaRepo.create({
      // Đường dẫn tương đối — xem ghi chú ở saveUpload phía trên.
      url: `/uploads/${filename}`,
      fileName: filename,
      mimeType: 'image/webp',
      size: stat.size,
      altText: metadata?.altText ?? null,
      caption: metadata?.caption ?? null,
    });

    return this.mediaRepo.save(media);
  }

  findAll() {
    return this.mediaRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Media> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) throw new NotFoundException('File không tồn tại');
    return media;
  }

  async update(id: number, dto: { fileName?: string; altText?: string; caption?: string }): Promise<Media> {
    const media = await this.findOne(id);
    if (dto.fileName !== undefined) media.fileName = dto.fileName;
    if (dto.altText !== undefined) media.altText = dto.altText;
    if (dto.caption !== undefined) media.caption = dto.caption;
    return this.mediaRepo.save(media);
  }

  async remove(id: number): Promise<void> {
    const media = await this.findOne(id);
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const filePath = path.resolve(uploadDir, media.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await this.mediaRepo.remove(media);
  }
}

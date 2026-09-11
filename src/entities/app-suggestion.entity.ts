import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Loại nội dung khách gửi — dùng chung một bảng và một màn duyệt. */
export enum SuggestionKind {
  APP = 'app',
  PROMPT = 'prompt',
}

export enum SuggestionStatus {
  NEW = 'new',
  REVIEWING = 'reviewing',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

/** Ứng dụng do khách đề xuất từ nút "+ Đề xuất ứng dụng" trên header. */
@Entity('app_suggestions')
export class AppSuggestion {
  @PrimaryGeneratedColumn()
  id: number;

  /** Phân loại: đề xuất ứng dụng, hay prompt gửi cho thư viện */
  @Index()
  @Column({ type: 'varchar', length: 20, default: SuggestionKind.APP })
  kind: SuggestionKind;

  /** Tên ứng dụng được đề xuất, hoặc tiêu đề prompt khi kind = 'prompt' */
  @Column({ length: 255 })
  appName: string;

  /** Trang chủ của ứng dụng */
  @Column({ length: 500, nullable: true })
  website: string;

  /** Slug danh mục người gửi chọn (video, ai, marketing…) — không ràng buộc FK
   *  vì danh mục có thể đổi mà đề xuất cũ vẫn cần giữ nguyên nội dung đã gửi. */
  @Column({ length: 100, nullable: true })
  categorySlug: string;

  /** Lý do nên đưa vào danh sách */
  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ length: 255, nullable: true })
  submitterName: string;

  @Column({ length: 255, nullable: true })
  submitterEmail: string;

  @Index()
  @Column({ type: 'varchar', length: 20, default: SuggestionStatus.NEW })
  status: SuggestionStatus;

  /** Ghi chú nội bộ của quản trị viên */
  @Column({ type: 'text', nullable: true })
  adminNote: string;

  /** Băm IP + user-agent, chỉ để chặn spam — không lưu IP thô */
  @Column({ type: 'varchar', length: 64, nullable: true })
  submitterKey: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

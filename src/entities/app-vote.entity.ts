import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from './post.entity';

/**
 * Phiếu chấm sao của khách truy cập cho một ứng dụng.
 *
 * Không yêu cầu đăng nhập: mỗi khách được nhận diện bằng `voterKey` —
 * chuỗi băm SHA-256 của IP + User-Agent. Không lưu IP thô.
 * Ràng buộc UNIQUE(postId, voterKey) đảm bảo mỗi khách chỉ có một phiếu
 * cho mỗi ứng dụng; bình chọn lại thì cập nhật phiếu cũ.
 */
@Entity('app_votes')
@Unique('UQ_app_votes_post_voter', ['postId', 'voterKey'])
export class AppVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  postId: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  /** 1 đến 5 sao */
  @Column({ type: 'smallint' })
  rating: number;

  /** SHA-256 của "ip|user-agent" — 64 ký tự hex */
  @Column({ length: 64 })
  @Index()
  voterKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

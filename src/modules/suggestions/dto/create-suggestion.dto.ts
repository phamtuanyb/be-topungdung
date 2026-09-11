import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SuggestionKind } from '../../../entities/app-suggestion.entity';

export class CreateSuggestionDto {
  @ApiPropertyOptional({ enum: SuggestionKind, default: SuggestionKind.APP })
  @IsOptional()
  @IsEnum(SuggestionKind)
  kind?: SuggestionKind;

  @ApiProperty({ example: 'Notion', description: 'Tên ứng dụng đề xuất' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  appName: string;

  @ApiPropertyOptional({ example: 'https://notion.so' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ example: 'ai', description: 'Slug nhóm nhu cầu' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categorySlug?: string;

  @ApiPropertyOptional({ example: 'Ghi chú, quản lý dự án rất tốt cho nhóm nhỏ.' })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  reason?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  submitterName?: string;

  @ApiPropertyOptional({ example: 'ban@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  submitterEmail?: string;
}

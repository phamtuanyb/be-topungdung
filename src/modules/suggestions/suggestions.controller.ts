import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuggestionStatus } from '../../entities/app-suggestion.entity';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { SuggestionsService } from './suggestions.service';

function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

@ApiTags('App Suggestions')
@Controller('api')
export class SuggestionsController {
  constructor(private readonly service: SuggestionsService) {}

  @Post('app-suggestions')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Khách gửi đề xuất ứng dụng mới' })
  create(@Body() dto: CreateSuggestionDto, @Req() req: Request) {
    const key = this.service.buildSubmitterKey(
      clientIp(req),
      String(req.headers['user-agent'] ?? ''),
    );
    return this.service.create(dto, key);
  }

  // ─── ADMIN ──────────────────────────────────────────────────────────────────

  @Get('admin/app-suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Danh sách đề xuất (admin)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: SuggestionStatus,
  ) {
    return this.service.findAllAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
    );
  }

  @Get('admin/app-suggestions/counts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đếm đề xuất theo trạng thái (admin)' })
  counts() {
    return this.service.countsByStatus();
  }

  @Patch('admin/app-suggestions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đổi trạng thái / ghi chú đề xuất (admin)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSuggestionDto) {
    return this.service.update(id, dto);
  }

  @Delete('admin/app-suggestions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xoá đề xuất (admin)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { message: 'Đã xoá đề xuất' };
  }
}

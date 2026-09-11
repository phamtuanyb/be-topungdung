import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoteDto } from './dto/vote.dto';
import { VotesService } from './votes.service';

/** Lấy IP thật, có tính tới reverse proxy. */
function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

@ApiTags('Votes')
@Controller('api/apps')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  private keyOf(req: Request): string {
    return this.votesService.buildVoterKey(
      clientIp(req),
      String(req.headers['user-agent'] ?? ''),
    );
  }

  @Get('vote-summary')
  @ApiOperation({ summary: 'Thống kê bình chọn của toàn bộ ứng dụng (cho trang xếp hạng)' })
  async summaryAll(@Req() req: Request) {
    // TransformInterceptor tự bọc {data} — không bọc thêm ở đây.
    return this.votesService.summaryAll(this.keyOf(req));
  }

  @Get(':slug/vote')
  @ApiOperation({ summary: 'Thống kê bình chọn của một ứng dụng' })
  async summary(@Param('slug') slug: string, @Req() req: Request) {
    return this.votesService.summary(slug, this.keyOf(req));
  }

  // Chặn spam ở đúng endpoint ghi công khai này.
  // (ThrottlerModule đã cấu hình 10 lượt / 60 giây trong AppModule.)
  @Post(':slug/vote')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Chấm sao cho ứng dụng — bình chọn lại sẽ ghi đè phiếu cũ' })
  async vote(@Param('slug') slug: string, @Body() dto: VoteDto, @Req() req: Request) {
    return this.votesService.vote(slug, dto.rating, this.keyOf(req));
  }

  @Delete(':slug/vote')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Rút lại phiếu bình chọn' })
  async unvote(@Param('slug') slug: string, @Req() req: Request) {
    return this.votesService.unvote(slug, this.keyOf(req));
  }
}

@ApiTags('Votes')
@UseGuards(JwtAuthGuard)
@Controller('api/admin/votes')
export class AdminVotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách phiếu bình chọn để kiểm duyệt' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.votesService.findAllAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá một phiếu bình chọn' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.votesService.removeAdmin(id);
    return { message: 'Đã xoá phiếu bình chọn' };
  }
}

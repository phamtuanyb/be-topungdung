import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SiteSettingsService } from './site-settings.service';

@ApiTags('Site Settings')
@Controller('api/settings')
export class SiteSettingsController {
  constructor(private service: SiteSettingsService) {}

  @Get(':key')
  @ApiOperation({ summary: 'Lấy setting theo key (public)' })
  get(@Param('key') key: string) {
    return this.service.get(key);
  }

  @Put(':key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật setting theo key (admin)' })
  upsert(@Param('key') key: string, @Body() body: object) {
    return this.service.upsert(key, body);
  }
}

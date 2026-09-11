import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('api/admin/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Chặn dò mật khẩu: 5 lượt / 5 phút cho mỗi địa chỉ.
   *
   * `ThrottlerModule` đã được khai ở app.module nhưng KHÔNG đăng ký làm guard
   * toàn cục, nên trước đây chỉ vài nơi khai @UseGuards mới bị chặn — riêng
   * đăng nhập thì thử bao nhiêu lần cũng được.
   *
   * Không đặt guard toàn cục vì mức chung 10 lượt/60 giây sẽ chặn nhầm người
   * đọc bình thường: mỗi lần mở trang là vài lượt gọi API nội dung.
   */
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập — trả về accessToken (15m) + refreshToken (30d)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Refresh token cũng là mục tiêu dò tìm, nhưng người dùng thật gọi thường
  // xuyên hơn đăng nhập nên để hạn mức rộng hơn.
  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi refresh token lấy cặp token mới' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản đang đăng nhập' })
  getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất — thu hồi refresh token' })
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }
}

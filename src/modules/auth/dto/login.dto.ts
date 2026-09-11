import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@topungdung.net', description: 'Email đăng nhập' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  // Không đặt mật khẩu thật làm ví dụ: trang tài liệu API hiển thị công khai
  // giá trị này, trước đây nó chính là mật khẩu của tài khoản quản trị.
  @ApiProperty({ example: '••••••••', description: 'Mật khẩu' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}

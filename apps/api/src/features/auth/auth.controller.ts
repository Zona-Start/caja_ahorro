import { Public } from '@/common/decorators';
import { JwtRefreshGuard } from '@/common/guards/jwt-refresh.guard';
import { RefreshTokenDto } from '@/features/auth/dto/refresh-token.dto';
import { SignInUserDto } from '@/features/auth/dto/signIn-user.dto';
import { SignOutUserDto } from '@/features/auth/dto/signOut-user.dto';
import {
  Body,
  Controller,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(200)
  @Post('sign-in')
  async signIn(@Body() signInUserDto: SignInUserDto) {
    return await this.authService.signIn(signInUserDto);
  }

  @Post('sign-out')
  //@RequirePermissions('auth:sign-out')
  async signOut(@Body() signOutUserDto: SignOutUserDto) {
    await this.authService.signOut(signOutUserDto);
    return { message: 'User signed out successfully' };
  }

  // @Post('forgot-password')
  // async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
  //   await this.authService.forgotPassword(forgotPasswordDto);
  //   return { message: 'Password reset link sent to your email' };
  // }

  @UseGuards(JwtRefreshGuard)
  @Patch('refresh-token')
  //@RequirePermissions('auth:refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }
}

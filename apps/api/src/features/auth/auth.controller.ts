import { Public } from '@/common/decorators/public.decorator';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.dto';
import { RequestWithUser } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private getLoginContext(req: any) {
    return {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      deviceFingerprint: req.headers['x-device-fingerprint'],
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginInput, @Req() req: any, @Res() res: any) {
    const context = this.getLoginContext(req);
    const result = await this.authService.login(loginDto, context);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
      partitioned: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any, @Res() res: any) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const context = this.getLoginContext(req);

    try {
      const result = await this.authService.refreshTokens(
        refreshToken,
        context,
      );

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        path: '/',
        partitioned: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res() res: any) {
    const userId = req.user?.userId;

    if (userId) {
      await this.authService.logout(userId);
    }

    res.clearCookie('refreshToken');
    return res.json({ message: 'Logged out successfully' });
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: any, @Res() res: any) {
    const userId = req.user?.userId;

    if (userId) {
      await this.authService.revokeAllSessions(userId);
    }

    res.clearCookie('refreshToken');
    return res.json({ message: 'All sessions revoked successfully' });
  }

  @Get('debug')
  debug(@Req() req: RequestWithUser) {
    return {
      user: req.user,
      headers: req.headers,
    };
  }
}

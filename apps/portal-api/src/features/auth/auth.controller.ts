import {
  CurrentMember,
  PortalMemberContext,
} from '@/common/decorators/current-member.decorator';
import { Public } from '@/common/decorators/public.decorator';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService, PORTAL_REFRESH_COOKIE } from './auth.service';
import { ChangePasswordInput } from './dto/change-password.dto';
import { LoginInput } from './dto/login.dto';
import {
  ForgotPasswordInput,
  ResetPasswordInput,
} from './dto/password-reset.dto';

const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private context(req: Request) {
    return {
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
      deviceFingerprint: req.headers['x-device-fingerprint'] as
        string | undefined,
    };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(PORTAL_REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }

  @Public()
  @Post('login')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión (usuario = cédula)' })
  async login(
    @Body() dto: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, this.context(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar sesión (rotación de refresh)' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[PORTAL_REFRESH_COOKIE];
    const result = await this.authService.refreshTokens(
      token,
      this.context(req),
    );
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar la sesión actual' })
  async logout(
    @CurrentMember() member: PortalMemberContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(member.accountId, member.sid);
    res.clearCookie(PORTAL_REFRESH_COOKIE, { path: '/' });
    return { message: 'Sesión cerrada' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar todas las sesiones' })
  async logoutAll(
    @CurrentMember() member: PortalMemberContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeAllSessions(member.accountId);
    res.clearCookie(PORTAL_REFRESH_COOKIE, { path: '/' });
    return { message: 'Todas las sesiones fueron cerradas' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña (opcional)' })
  async changePassword(
    @CurrentMember() member: PortalMemberContext,
    @Body() dto: ChangePasswordInput,
  ) {
    return this.authService.changePassword(member, dto);
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña (OTP por correo)',
  })
  async forgotPassword(@Body() dto: ForgotPasswordInput) {
    return this.authService.forgotPassword(dto.identifier);
  }

  @Public()
  @Post('reset-password')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con OTP' })
  async resetPassword(@Body() dto: ResetPasswordInput) {
    return this.authService.resetPassword(dto);
  }
}

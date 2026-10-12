import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { OtpModule } from '../otp/otp.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PortalJwtStrategy } from './strategies/portal-jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'portal-jwt' }),
    JwtModule.register({}),
    OtpModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PortalJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

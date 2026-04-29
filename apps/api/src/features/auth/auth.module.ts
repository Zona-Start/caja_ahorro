import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CoreModule } from '../core/core.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [DrizzleModule, CoreModule, AuditModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}

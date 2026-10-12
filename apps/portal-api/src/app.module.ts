import { PortalAuthGuard } from '@/common/guards/portal-auth.guard';
import { LoggerModule, ThrottleModule } from '@/common/modules';
import { SecurityModule } from '@/common/security/security.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';
import { validateEnv } from './common/config/envs';
import { DrizzleModule } from './database/drizzle.module';
import { AuthModule } from './features/auth/auth.module';
import { CatalogModule } from './features/catalog/catalog.module';
import { HealthModule } from './features/health/health.module';
import { MemberModule } from './features/member/member.module';
import { OtpModule } from './features/otp/otp.module';
import { ProfileModule } from './features/profile/profile.module';
import { ProvisioningModule } from './features/provisioning/provisioning.module';
import { TenantPublicModule } from './features/tenant/tenant-public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validate: validateEnv,
    }),
    LoggerModule,
    ThrottleModule,
    ScheduleModule.forRoot(),
    DrizzleModule,
    SecurityModule,
    AuthModule,
    OtpModule,
    MemberModule,
    ProfileModule,
    CatalogModule,
    ProvisioningModule,
    TenantPublicModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PortalAuthGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}

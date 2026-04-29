import {
  JwtAuthGuard,
  PermissionsGuard,
  RolesGuard,
  TenantGuard,
} from '@/common/guards';
import { LoggerModule, ThrottleModule } from '@/common/modules';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';
import { ZodValidationPipe } from 'nestjs-zod';
import { validateEnv } from './common/config/envs';
import { TenantClsInterceptor } from './common/interceptors/tenant-cls.interceptor';
import {
  RequestContextMiddleware,
  TenantClsInterceptorMiddleware,
} from './common/middlewares';
import { DrizzleModule } from './database/drizzle.module';
import { SeedModule } from './database/seeds/seed.module';
import { AccountingFeaturesModule } from './features/accounting/accounting.module';
import { AuditModule } from './features/audit/audit.module';
import { AuthModule } from './features/auth/auth.module';
import { BankingsModule } from './features/bankings/bankings.module';
import { CoreModule } from './features/core/core.module';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantClsInterceptor,
    },
  ],
  imports: [
    JwtModule.register({
      global: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true, // Disponible en todos los módulos sin necesidad de importarlo
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validate: validateEnv, // <-- NestJS pasará el objeto parseado por Zod antes de arrancar
    }),
    EventEmitterModule.forRoot(),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    //NodeMailerModule,
    LoggerModule,
    ThrottleModule,
    DrizzleModule,
    AuditModule,
    AuthModule,
    CoreModule,
    AccountingFeaturesModule,
    BankingsModule,
    SeedModule,
    //MailModule,
    //SavingsBanksFeatureModule,
    //BankingsModule,
    //AdministrationFeaturesModule,
    //ReportsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware, TenantClsInterceptorMiddleware)
      .forRoutes('*');
  }
}

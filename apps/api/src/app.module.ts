import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '@/common/guards';
import {
  LoggerModule,
  NodeMailerModule,
  ThrottleModule,
} from '@/common/modules';
import { UsersModule } from '@/features/users/users.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DrizzleModule } from './database/drizzle.module';
import { AccountingModule } from './features/accounting/accounting.module';
import { AuditModule } from './features/audit/audit.module';
import { AuthModule } from './features/auth/auth.module';
import { BanksModule } from './features/banks/banks.module';
import { ConfigurationsModule } from './features/configurations/configurations.module';
import { MailModule } from './features/mail/mail.module';
import { PermissionsModule } from './features/permissions/permissions.module';
import { RolePermissionsModule } from './features/role-permissions/role-permissions.module';
import { RolesModule } from './features/roles/roles.module';
import { RoutePermissionsModule } from './features/route-permissions/route-permissions.module';
import { SavingsBankFeatureModule } from './features/savings-bank/savings-bank.module';
import { UserRolesModule } from './features/user-roles/user-roles.module';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
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
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  imports: [
    JwtModule.register({
      global: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      //validate: validateEnv,
    }),
    NodeMailerModule,
    LoggerModule,
    ThrottleModule,
    UsersModule,
    AuthModule,
    MailModule,
    DrizzleModule,
    RolesModule,
    PermissionsModule,
    RolePermissionsModule,
    UserRolesModule,
    RoutePermissionsModule,
    AuditModule,
    ConfigurationsModule,
    SavingsBankFeatureModule,
    AccountingModule,
    BanksModule,
  ],
})
export class AppModule {}

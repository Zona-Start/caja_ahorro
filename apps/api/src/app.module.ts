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
import { AdministrationFeaturesModule } from './features/administration/administration.module';
import { AuditModule } from './features/audit/audit.module';
import { AuthModule } from './features/auth/auth.module';
import { BankingsModule } from './features/bankings/bankings.module';
import { CoreModule } from './features/core/core.module';
import { MailModule } from './features/mail/mail.module';
import { PermissionsModule } from './features/permissions/permissions.module';
import { RolePermissionsModule } from './features/role-permissions/role-permissions.module';
import { RolesModule } from './features/roles/roles.module';
import { SavingsBanksFeatureModule } from './features/savings-banks/savings-banks.module';
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
    AuditModule,
    CoreModule,
    SavingsBanksFeatureModule,
    AccountingModule,
    BankingsModule,
    AdministrationFeaturesModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CategoriesModule } from './categories/categories.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';
import { RolesPermissionsModule } from './roles-permissions/roles-permissions.module';
import { BcryptService } from './security/bcrypt.service';
import { CryptographyModule } from './security/cryptography.module';
import { CryptographyService } from './security/cryptography.service';
import { SecurityModule } from './security/security.module';
import { SecurityService } from './security/security.service';
import { SessionsModule } from './sessions/sessions.module';
import { SettingsModule } from './settings/settings.module';
import { StatesModule } from './states/states.module';
import { TenantSettingsModule } from './tenants/settings/tenant-settings.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';

@Module({
  imports: [
    CategoriesModule,
    CurrenciesModule,
    ExchangeRateModule,
    RolesPermissionsModule,
    SecurityModule,
    SessionsModule,
    SettingsModule,
    StatesModule,
    TenantsModule,
    TenantSettingsModule,
    UsersModule,
    CryptographyModule,
    AuditModule,
  ],
  providers: [
    UsersService,
    SecurityService,
    { provide: 'BCRYPT_SERVICE', useClass: BcryptService },
    CryptographyService,
  ],
  exports: [
    UsersService,
    SecurityService,
    'BCRYPT_SERVICE',
    CryptographyService,
  ],
})
export class CoreModule { }

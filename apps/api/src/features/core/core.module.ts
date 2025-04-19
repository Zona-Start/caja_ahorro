import { Module } from '@nestjs/common';
import { CategoryTypesModule } from './category-types/category-types.module';
import { CompanyModule } from './company/company.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { ExchangeRatesModule } from './exchange-rates/exchanges-rates.module';
import { MunicipalitiesModule } from './municipalities/municipalities.module';
import { ParishesModule } from './parishes/parishes.module';
import { SettingsSystemModule } from './settings-system/settings-system.module';
import { StatesModule } from './states/states.module';
import { TransactionTypeModule } from './transaction-type/transaction-type.module';

@Module({
  imports: [
    StatesModule,
    MunicipalitiesModule,
    ParishesModule,
    CategoryTypesModule,
    TransactionTypeModule,
    CompanyModule,
    SettingsSystemModule,
    CurrenciesModule,
    ExchangeRatesModule,
  ],
})
export class CoreModule {}

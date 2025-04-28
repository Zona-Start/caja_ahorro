import { Module } from '@nestjs/common';
import { CategoryTypesModule } from './category-types/category-types.module';
import { CompanyModule } from './company/company.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { ExchangeRatesModule } from './exchange-rates/exchanges-rates.module';
import { MunicipalitiesModule } from './municipalities/municipalities.module';
import { ParishesModule } from './parishes/parishes.module';
import { SettingsSystemModule } from './settings-system/settings-system.module';
import { StatesModule } from './states/states.module';
import { TypeOperationsModule } from './type-operations/type-operations.module';

@Module({
  imports: [
    StatesModule,
    MunicipalitiesModule,
    ParishesModule,
    CategoryTypesModule,
    TypeOperationsModule,
    CompanyModule,
    SettingsSystemModule,
    CurrenciesModule,
    ExchangeRatesModule,
  ],
})
export class CoreModule {}

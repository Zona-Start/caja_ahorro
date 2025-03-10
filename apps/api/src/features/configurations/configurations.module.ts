import { Module } from '@nestjs/common';
import { CategoryTypesModule } from './category-types/category-types.module';
import { MunicipalitiesModule } from './municipalities/municipalities.module';
import { ParishesModule } from './parishes/parishes.module';
import { StatesModule } from './states/states.module';

@Module({
  imports: [
    StatesModule,
    MunicipalitiesModule,
    ParishesModule,
    CategoryTypesModule,
  ],
})
export class ConfigurationsModule {}

import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { MunicipalitiesModule } from '../municipalities/municipalities.module';
import { ParishesController } from './parishes.controller';
import { ParishesService } from './parishes.service';

@Module({
  imports: [DrizzleModule, MunicipalitiesModule],
  controllers: [ParishesController],
  providers: [ParishesService],
  exports: [ParishesService],
})
export class ParishesModule {}

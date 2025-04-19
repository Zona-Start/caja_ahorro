import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { StatesModule } from '../states/states.module';
import { MunicipalitiesController } from './municipalities.controller';
import { MunicipalitiesService } from './municipalities.service';

@Module({
  imports: [DrizzleModule, StatesModule],
  controllers: [MunicipalitiesController],
  providers: [MunicipalitiesService],
  exports: [MunicipalitiesService],
})
export class MunicipalitiesModule {}

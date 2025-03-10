import { Module } from '@nestjs/common';
import { MovementsCountableController } from './movements-countable.controller';
import { MovementsCountableService } from './movements-countable.service';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [MovementsCountableController],
  providers: [MovementsCountableService],
  exports: [MovementsCountableService],
})
export class MovementsCountableModule {}
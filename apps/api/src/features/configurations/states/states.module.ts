import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { StatesController } from './states.controller';
import { StatesService } from './states.service';

@Module({
  imports: [DrizzleModule],
  controllers: [StatesController],
  providers: [StatesService],
  exports: [StatesService],
})
export class StatesModule {}

import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AccountingCyclesController } from './accounting-cycles.controller';
import { AccountingCyclesService } from './accounting-cycles.service';

@Module({
  imports: [DrizzleModule],
  controllers: [AccountingCyclesController],
  providers: [AccountingCyclesService],
  exports: [AccountingCyclesService], // Exporta AccountingCyclesService para su us
})
export class AccountingCyclesModule {}

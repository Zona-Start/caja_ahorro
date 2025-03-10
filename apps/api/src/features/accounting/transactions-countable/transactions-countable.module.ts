import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { TransactionsCountableController } from './transactions-countable.controller';
import { TransactionsCountableService } from './transactions-countable.service';

@Module({
  imports: [DrizzleModule],
  controllers: [TransactionsCountableController],
  providers: [TransactionsCountableService],
  exports: [TransactionsCountableService],
})
export class TransactionsCountableModule {}

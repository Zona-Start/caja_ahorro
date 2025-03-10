import { Module } from '@nestjs/common';
import { TransactionTypesController } from './transaction-types.controller';
import { TransactionTypesService } from './transaction-types.service';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [TransactionTypesController],
  providers: [TransactionTypesService],
  exports: [TransactionTypesService],
})
export class TransactionTypesModule {}
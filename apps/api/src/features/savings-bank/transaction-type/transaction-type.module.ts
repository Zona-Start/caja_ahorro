import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { TransactionTypeController } from './transaction-type.controller';
import { TransactionTypeService } from './transaction-type.service';

@Module({
  imports: [DrizzleModule],
  controllers: [TransactionTypeController],
  providers: [TransactionTypeService],
})
export class TransactionTypeModule {}

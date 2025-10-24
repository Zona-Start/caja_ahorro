import { Module } from '@nestjs/common';
import { ReportsAssociatedDebtsController } from './controllers/reports-associated-debts.controller';
import { ReportsAssociatedDebtsService } from './services/reports-associated-debts.service';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [ReportsAssociatedDebtsController],
  providers: [ReportsAssociatedDebtsService],
})
export class ReportsModule {}
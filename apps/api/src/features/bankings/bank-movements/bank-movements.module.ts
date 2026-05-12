import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/database/drizzle.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { BankMovementsController } from './bank-movements.controller';
import { BankMovementsService } from './bank-movements.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [BankMovementsController],
  providers: [BankMovementsService],
  exports: [BankMovementsService],
})
export class BankMovementsModule {}

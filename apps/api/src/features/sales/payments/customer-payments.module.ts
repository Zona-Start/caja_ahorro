import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { CashMovementsModule } from '@/features/expenses/cash-movements/cash-movements.module';
import { Module } from '@nestjs/common';
import { CustomerPaymentsController } from './customer-payments.controller';
import { CustomerPaymentsService } from './customer-payments.service';

@Module({
  imports: [
    DrizzleModule,
    TenantContextModule,
    GenerateCodeModule,
    CashMovementsModule,
  ],
  controllers: [CustomerPaymentsController],
  providers: [CustomerPaymentsService],
  exports: [CustomerPaymentsService],
})
export class CustomerPaymentsModule {}

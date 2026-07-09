import { PdfGeneratorModule } from '@/common/modules/pdf-generator/pdf-generator.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AccountingEntriesModule } from '@/features/accounting/accounting-entries/accounting-entries.module';
import { BankMovementsModule } from '@/features/bankings/bank-movements/bank-movements.module';
import { EventBusModule } from '@/shared/event-bus';
import { WsModule } from '@/shared/websocket';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.module';
import { LoanPaidController } from './loan-paid.controller';
import { LoanPaidService } from './loan-paid.service';
import { LoanPaymentValidator } from './domain/loan-payment.validator';
import { LoanPaymentProcessor } from './domain/loan-payment.processor';
import { LoanPaymentAccounting } from './domain/loan-payment.accounting';
import { LoanPaymentBank } from './domain/loan-payment.bank';
import { LoanPaymentAudit } from './domain/loan-payment.audit';
import { CreatePaymentUseCase } from './use-cases/create-payment.usecase';
import { BulkPaymentUseCase } from './use-cases/bulk-payment.usecase';
import { CancelPaymentUseCase } from './use-cases/cancel-payment.usecase';
import { LoanPaymentAuditSubscriber } from './subscribers/loan-payment-audit.subscriber';
import { LoanPaymentWsSubscriber } from './subscribers/loan-payment-ws.subscriber';
import { LoanPaymentAccountingSubscriber } from './subscribers/loan-payment-accounting.subscriber';
import { LoanPaymentBankingSubscriber } from './subscribers/loan-payment-banking.subscriber';

@Module({
  imports: [
    DrizzleModule,
    AssociateAccountsMovementsModule,
    GenerateCodeModule,
    AccountingEntriesModule,
    PdfGeneratorModule,
    BankMovementsModule,
    TenantContextModule,
    EventBusModule,
    WsModule,
  ],
  controllers: [LoanPaidController],
  providers: [
    LoanPaidService,
    LoanPaymentValidator,
    LoanPaymentProcessor,
    LoanPaymentAccounting,
    LoanPaymentBank,
    LoanPaymentAudit,
    CreatePaymentUseCase,
    BulkPaymentUseCase,
    CancelPaymentUseCase,
    LoanPaymentAuditSubscriber,
    LoanPaymentWsSubscriber,
    LoanPaymentAccountingSubscriber,
    LoanPaymentBankingSubscriber,
  ],
  exports: [LoanPaidService],
})
export class LoanPaidModule {}

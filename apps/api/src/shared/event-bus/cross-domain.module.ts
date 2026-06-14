import { Global, Module, OnModuleInit } from '@nestjs/common';
import { EventRouter } from '@/shared/event-bus/event-router';
import { LOAN_EVENTS, INVENTORY_EVENTS, ACCOUNTING_EVENTS, BANKING_EVENTS, PURCHASING_EVENTS, PARTNER_EVENTS } from '@/shared/event-types';

@Global()
@Module({})
export class CrossDomainModule implements OnModuleInit {
  constructor(private readonly router: EventRouter) {}

  onModuleInit() {
    this.router.register({ event: LOAN_EVENTS.PAYMENT_CREATED, domain: 'savings', description: 'Loan payment registered', sourceModule: 'savings', targetModules: ['accounting', 'banking'] });
    this.router.register({ event: LOAN_EVENTS.PAYMENT_CANCELLED, domain: 'savings', description: 'Loan payment cancelled', sourceModule: 'savings', targetModules: ['accounting', 'banking'] });
    this.router.register({ event: LOAN_EVENTS.PAYMENT_COMPLETED, domain: 'savings', description: 'Loan payment completed', sourceModule: 'savings', targetModules: ['accounting', 'banking'] });
    this.router.register({ event: LOAN_EVENTS.LOAN_DISBURSED, domain: 'savings', description: 'Loan disbursed', sourceModule: 'savings', targetModules: ['accounting'] });
    this.router.register({ event: LOAN_EVENTS.LOAN_CANCELLED, domain: 'savings', description: 'Loan cancelled', sourceModule: 'savings', targetModules: ['accounting'] });

    this.router.register({ event: INVENTORY_EVENTS.MOVEMENT_CREATED, domain: 'inventory', description: 'Inventory movement created', sourceModule: 'inventory', targetModules: ['accounting'] });
    this.router.register({ event: INVENTORY_EVENTS.STOCK_LEVEL_CHANGED, domain: 'inventory', description: 'Stock level changed', sourceModule: 'inventory', targetModules: ['purchasing'] });
    this.router.register({ event: INVENTORY_EVENTS.PRODUCT_CREATED, domain: 'inventory', description: 'Product created', sourceModule: 'inventory', targetModules: ['accounting'] });

    this.router.register({ event: ACCOUNTING_EVENTS.ENTRY_POSTED, domain: 'accounting', description: 'Accounting entry posted', sourceModule: 'accounting', targetModules: ['banking'] });
    this.router.register({ event: ACCOUNTING_EVENTS.ENTRY_CANCELLED, domain: 'accounting', description: 'Accounting entry cancelled', sourceModule: 'accounting', targetModules: ['banking'] });
    this.router.register({ event: ACCOUNTING_EVENTS.CYCLE_CLOSED, domain: 'accounting', description: 'Accounting cycle closed', sourceModule: 'accounting', targetModules: ['savings', 'inventory', 'purchasing'] });

    this.router.register({ event: BANKING_EVENTS.MOVEMENT_CREATED, domain: 'banking', description: 'Bank movement created', sourceModule: 'banking', targetModules: ['accounting'] });
    this.router.register({ event: BANKING_EVENTS.MOVEMENT_RECONCILED, domain: 'banking', description: 'Bank movement reconciled', sourceModule: 'banking', targetModules: ['savings', 'purchasing'] });

    this.router.register({ event: PURCHASING_EVENTS.ORDER_CREATED, domain: 'purchasing', description: 'Purchase order created', sourceModule: 'purchasing', targetModules: ['inventory'] });
    this.router.register({ event: PURCHASING_EVENTS.SUPPLIER_INVOICE_ACCOUNTED, domain: 'purchasing', description: 'Supplier invoice accounted', sourceModule: 'purchasing', targetModules: ['inventory', 'accounting'] });
    this.router.register({ event: PURCHASING_EVENTS.SUPPLIER_PAYMENT_CREATED, domain: 'purchasing', description: 'Supplier payment created', sourceModule: 'purchasing', targetModules: ['banking'] });

    this.router.register({ event: PARTNER_EVENTS.ACCOUNT_MOVEMENT_CREATED, domain: 'partners', description: 'Associate account movement', sourceModule: 'savings', targetModules: ['accounting'] });
    this.router.register({ event: PARTNER_EVENTS.SETTLEMENT_COMPLETED, domain: 'partners', description: 'Associate settlement completed', sourceModule: 'savings', targetModules: ['accounting'] });
  }
}

import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ProjectionRunner } from './projection-runner';
import { LoanBalanceProjection } from './loan-balance.projection';
import { InventoryStockProjection } from './inventory-stock.projection';
import { LedgerBalanceProjection } from './ledger-balance.projection';

@Global()
@Module({
  providers: [
    ProjectionRunner,
    LoanBalanceProjection,
    InventoryStockProjection,
    LedgerBalanceProjection,
  ],
  exports: [ProjectionRunner, LoanBalanceProjection, InventoryStockProjection, LedgerBalanceProjection],
})
export class ProjectionModule implements OnModuleInit {
  constructor(
    private readonly runner: ProjectionRunner,
    private readonly loanBalance: LoanBalanceProjection,
    private readonly inventoryStock: InventoryStockProjection,
    private readonly ledgerBalance: LedgerBalanceProjection,
  ) {}

  onModuleInit() {
    this.runner.register(this.loanBalance);
    this.runner.register(this.inventoryStock);
    this.runner.register(this.ledgerBalance);
  }
}

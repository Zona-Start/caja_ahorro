import { Module } from '@nestjs/common';
import { AccountingRulesController } from './accounting-rules.controller';
import { AccountingRulesService } from './accounting-rules.service';

@Module({
  controllers: [AccountingRulesController],
  providers: [AccountingRulesService],
  exports: [AccountingRulesService],
})
export class AccountingRulesModule {}

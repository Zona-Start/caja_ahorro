import { Module } from '@nestjs/common';
import { WithdrawalAssociateModule } from './withdrawal-associate/withdrawal-associate.module';
import { WithdrawalTypesModule } from './withdrawal-types/withdrawal-types.module';

@Module({
  imports: [WithdrawalTypesModule, WithdrawalAssociateModule],
})
export class WithdrawalFeaturesModule {}

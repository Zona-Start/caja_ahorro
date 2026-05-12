import { DrizzleModule } from '@/database/drizzle.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsController } from './associate-accounts-movements.controller';
import { AssociateAccountsMovementsService } from './associate-accounts-movements.service';
import { TenantContextModule } from '@/common/services/tenant-context.module';

@Module({
  imports: [DrizzleModule, GenerateCodeModule, TenantContextModule],
  controllers: [AssociateAccountsMovementsController],
  providers: [AssociateAccountsMovementsService],
  exports: [AssociateAccountsMovementsService],
})
export class AssociateAccountsMovementsModule {}

import { PdfGeneratorModule } from '@/common/modules/pdf-generator/pdf-generator.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { AuditModule } from '@/features/audit/audit.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../associate-accounts-movements/associate-accounts-movements.module';
import { AssociatesController } from './associates.controller';
import { AssociatesService } from './associates.service';

@Module({
  imports: [
    DrizzleModule,
    TenantContextModule,
    AssociateAccountsMovementsModule,
    PdfGeneratorModule,
    AuditModule,
  ],
  controllers: [AssociatesController],
  providers: [AssociatesService],
  exports: [AssociatesService],
})
export class AssociatesModule {}

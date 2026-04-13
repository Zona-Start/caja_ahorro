import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AssociateAccountsMovementsModule } from '../associate-accounts-movements/associate-accounts-movements.module';
import { AssociatesController } from './associates.controller';
import { AssociatesService } from './associates.service';
import { PdfGeneratorModule } from '@/common/modules/pdf-generator/pdf-generator.module';

@Module({
  imports: [DrizzleModule, AssociateAccountsMovementsModule, PdfGeneratorModule],
  controllers: [AssociatesController],
  providers: [AssociatesService],
  exports: [AssociatesService],
})
export class AssociatesModule {}

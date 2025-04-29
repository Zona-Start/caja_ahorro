import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { LoanTypesController } from './loan-types.controller';
import { LoanTypesService } from './loan-types.service';

@Module({
  imports: [DrizzleModule],
  controllers: [LoanTypesController],
  providers: [LoanTypesService],
  exports: [LoanTypesService],
})
export class LoanTypesModule {}

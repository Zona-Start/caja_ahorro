import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { CreditTypesController } from './credit-types.controller';
import { CreditTypesService } from './credit-types.service';

@Module({
  imports: [DrizzleModule],
  controllers: [CreditTypesController],
  providers: [CreditTypesService],
  exports: [CreditTypesService],
})
export class CreditTypesModule {}

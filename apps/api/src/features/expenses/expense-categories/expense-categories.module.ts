import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { ExpenseCategoriesService } from './expense-categories.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [ExpenseCategoriesController],
  providers: [ExpenseCategoriesService],
  exports: [ExpenseCategoriesService],
})
export class ExpenseCategoriesModule {}

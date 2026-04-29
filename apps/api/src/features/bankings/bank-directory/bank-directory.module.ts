import { Module } from '@nestjs/common';
import { BankDirectoryController } from './bank-directory.controller';
import { BankDirectoryService } from './bank-directory.services';
import { DrizzleModule } from '@/database/drizzle.module';
import { TenantContextModule } from '@/common/services/tenant-context.module';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [BankDirectoryController],
  providers: [BankDirectoryService],
  exports: [BankDirectoryService],
})
export class BankDirectoryModule {}

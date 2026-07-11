import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { BankDirectoryController } from './bank-directory.controller';
import { BankDirectoryService } from './bank-directory.services';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [BankDirectoryController],
  providers: [BankDirectoryService],
  exports: [BankDirectoryService],
})
export class BankDirectoryModule {}

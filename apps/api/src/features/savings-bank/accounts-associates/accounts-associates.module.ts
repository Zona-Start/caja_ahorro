import { Module } from '@nestjs/common';
import { AccountsAssociatesController } from './accounts-associates.controller';
import { AccountsAssociatesService } from './accounts-associates.service';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [AccountsAssociatesController],
  providers: [AccountsAssociatesService],
  exports: [AccountsAssociatesService],
})
export class AccountsAssociatesModule {}
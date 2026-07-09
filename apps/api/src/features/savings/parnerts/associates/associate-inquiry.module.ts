import { TenantContextModule } from 'src/common/services/tenant-context.module';
import { DrizzleModule } from 'src/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AssociateInquiryController } from './associate-inquiry.controller';
import { AssociateInquiryService } from './associate-inquiry.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [AssociateInquiryController],
  providers: [AssociateInquiryService],
  exports: [AssociateInquiryService],
})
export class AssociateInquiryModule {}

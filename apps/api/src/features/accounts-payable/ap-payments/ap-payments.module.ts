import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { ApPaymentsController } from './controllers/ap-payments.controller';
import { ApPaymentsService } from './services/ap-payments.service';

@Module({
  imports: [DrizzleModule],
  controllers: [ApPaymentsController],
  providers: [ApPaymentsService],
  exports: [ApPaymentsService],
})
export class ApPaymentsModule {}

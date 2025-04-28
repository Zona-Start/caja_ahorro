import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { TypeOperationsController } from './type-operations.controller';
import { TypeOperationsService } from './type-operations.service';

@Module({
  imports: [DrizzleModule],
  controllers: [TypeOperationsController],
  providers: [TypeOperationsService],
})
export class TypeOperationsModule {}

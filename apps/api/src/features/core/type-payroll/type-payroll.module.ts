import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { TypePayrollController } from './type-payroll.controller';
import { TypePayrollService } from './type-payroll.service';

@Module({
  imports: [DrizzleModule],
  controllers: [TypePayrollController],
  providers: [TypePayrollService],
})
export class TypePayrollModule {}

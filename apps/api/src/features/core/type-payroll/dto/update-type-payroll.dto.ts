import { PartialType } from '@nestjs/swagger';
import { CreateTypePayrollDto } from './create-type-payroll.dto';

export class UpdateTypePayrollDto extends PartialType(CreateTypePayrollDto) {}

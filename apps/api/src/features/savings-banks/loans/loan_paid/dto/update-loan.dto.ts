import { PartialType } from '@nestjs/swagger';
import { CreateLoanPaidDto } from './create-loan.dto';

export class UpdateLoanDto extends PartialType(CreateLoanPaidDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreateAccountingCycleDto } from './create-accounting-cycle.dto';

export class UpdateAccountingCycleDto extends PartialType(CreateAccountingCycleDto) {}

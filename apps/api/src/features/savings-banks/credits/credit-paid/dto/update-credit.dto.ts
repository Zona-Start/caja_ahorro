import { PartialType } from '@nestjs/swagger';
import { CreateCreditPaidDto } from './create-credit.dto';

export class UpdateCreditDto extends PartialType(CreateCreditPaidDto) {}

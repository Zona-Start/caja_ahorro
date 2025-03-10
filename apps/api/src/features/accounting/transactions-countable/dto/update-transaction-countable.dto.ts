import { PartialType } from '@nestjs/swagger';
import { CreateTransactionCountableDto } from './create-transaction-countable.dto';

export class UpdateTransactionCountableDto extends PartialType(CreateTransactionCountableDto) {}
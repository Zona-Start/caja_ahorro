import { PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { CreateTransactionTypeDto } from './create-transaction-type.dto';

export class UpdateTransactionTypeDto extends PartialType(
  CreateTransactionTypeDto,
) {
  @IsInt()
  @IsNotEmpty()
  id: number;
}

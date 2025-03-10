import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTransactionCountableDto {
  @ApiProperty({ description: 'Savings bank ID' })
  @IsInt()
  savingsBankId: number;

  @ApiProperty({ description: 'Transaction type ID' })
  @IsInt()
  @IsOptional()
  transactionTypeId?: number;

  @ApiProperty({ description: 'Transaction date' })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ description: 'Transaction description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Reference number', required: false })
  @IsOptional()
  reference?: bigint;

  @ApiProperty({
    description: 'User ID who made the transaction',
    required: false,
  })
  @IsInt()
  @IsOptional()
  userId?: number;
}

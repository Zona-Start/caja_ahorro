import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSupplierTransactionDto {
  @ApiProperty({ description: 'Account Payable ID' })
  @IsInt()
  @IsNotEmpty()
  accountsPayableId: number;

  @ApiProperty({
    description: 'Transaction type',
    enum: ['CREDIT_NOTE', 'DEBIT_NOTE'],
  })
  @IsEnum(['CREDIT_NOTE', 'DEBIT_NOTE'])
  @IsNotEmpty()
  transactionType: 'CREDIT_NOTE' | 'DEBIT_NOTE';

  @ApiProperty({ description: 'Amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ description: 'Reference' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ description: 'Observations' })
  @IsString()
  @IsOptional()
  observations?: string;
}

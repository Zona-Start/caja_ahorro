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
  @ApiProperty({
    description: 'Transaction type',
    enum: ['CREDIT_NOTE', 'DEBIT_NOTE'],
  })
  @IsEnum(['CREDIT_NOTE', 'DEBIT_NOTE'])
  @IsNotEmpty()
  transactionType: 'CREDIT_NOTE' | 'DEBIT_NOTE';

  @ApiProperty({ description: 'Supplier ID' })
  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @ApiProperty({ description: 'Account Payable ID' })
  @IsInt()
  @IsOptional()
  accountsPayableId?: number;

  @ApiProperty({ description: 'Amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ description: 'Reason' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Observations' })
  @IsString()
  @IsOptional()
  observations?: string;
}

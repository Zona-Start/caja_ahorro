
import {
  currencyCodeEnum,
  supplierTransactionsTypeEnum,
} from '@/database/schema/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
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

  @ApiProperty({ description: 'Transaction date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  transactionDate: Date;

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

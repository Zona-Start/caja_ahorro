import {
  paymentMethodEnum,
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
  @ApiProperty({ description: 'Accounts Payable ID' })
  @IsInt()
  @IsNotEmpty()
  accountsPayableId: number;

  @ApiProperty({ description: 'Related AdvanceId ID' })
  @IsInt()
  @IsOptional()
  relatedAdvanceId?: number;

  @ApiProperty({ description: 'Transaction Number' })
  @IsString()
  @IsNotEmpty()
  transactionNumber: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: supplierTransactionsTypeEnum.enumValues,
  })
  @IsEnum(supplierTransactionsTypeEnum.enumValues)
  @IsNotEmpty()
  transactionType: (typeof supplierTransactionsTypeEnum.enumValues)[number];

  @ApiProperty({ description: 'Transaction date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  transactionDate: Date;

  @ApiProperty({ description: 'Amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Direction' })
  @IsString()
  @IsNotEmpty()
  direction: string;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: paymentMethodEnum.enumValues,
  })
  @IsEnum(paymentMethodEnum.enumValues)
  @IsOptional()
  paymentMethod?: (typeof paymentMethodEnum.enumValues)[number];

  @ApiPropertyOptional({ description: 'Bank Movement ID' })
  @IsInt()
  @IsOptional()
  bankMovementId?: number;

  @ApiPropertyOptional({ description: 'Reference' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ description: 'Status', enum: ['ACTIVE', 'REVERSED'] })
  @IsEnum(['ACTIVE', 'REVERSED'])
  @IsOptional()
  status?: 'ACTIVE' | 'REVERSED';

  @ApiPropertyOptional({ description: 'Created by ID' })
  @IsInt()
  @IsOptional()
  createdById?: number;
}

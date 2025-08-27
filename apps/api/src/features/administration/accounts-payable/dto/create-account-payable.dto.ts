import {
  currencyCodeEnum,
  paymentAccountsPayableEnum,
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

export class CreateAccountPayableDto {
  @ApiProperty({ description: 'Supplier Invoice ID' })
  @IsInt()
  @IsNotEmpty()
  supplierInvoiceId: number;

  @ApiProperty({ description: 'Original amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  originalAmount: number;

  @ApiPropertyOptional({ description: 'Paid amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  paidAmount?: number;

  @ApiProperty({ description: 'Remaining amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  remainingAmount: number;

  @ApiProperty({
    description: 'Currency code',
    enum: currencyCodeEnum.enumValues,
  })
  @IsEnum(currencyCodeEnum.enumValues)
  @IsNotEmpty()
  currencyCode: (typeof currencyCodeEnum.enumValues)[number];

  @ApiPropertyOptional({
    description: 'Status',
    enum: paymentAccountsPayableEnum.enumValues,
  })
  @IsEnum(paymentAccountsPayableEnum.enumValues)
  @IsOptional()
  status?: (typeof paymentAccountsPayableEnum.enumValues)[number];

  @ApiPropertyOptional({ description: 'Observations' })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;
}

import { CurrencyCodeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({ description: 'Company id' })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty({ description: 'Banks Directory Id ' })
  @IsNotEmpty()
  @IsNumber()
  bankDirectoryId: number;

  @ApiProperty({ description: 'Account number banks' })
  @IsNotEmpty()
  @IsString()
  @MinLength(20)
  @MaxLength(20)
  accountNumber: string;

  @ApiProperty({ description: 'Name Account banks', required: false })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({ description: 'Account Type Eje: Corriente | Ahorro' })
  @IsNotEmpty()
  @IsString()
  accountType: string;

  @ApiProperty({
    description: 'Accounting base currency',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
  })
  @IsEnum(CurrencyCodeEnum)
  currencyCode: CurrencyCodeEnum;

  @ApiProperty({ description: 'Opening date account', required: false })
  @IsOptional()
  @IsDate()
  openingDate?: Date;

  @ApiProperty({ description: 'Balance according to books', required: false })
  @IsOptional()
  @IsNumber()
  currentBalance?: number;

  @ApiProperty({
    description: 'Balance according to the last statement',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  lastStatementBalance?: number;

  @ApiProperty({
    description: 'Date Balance according to the last statement',
    required: false,
  })
  @IsOptional()
  @IsDate()
  lastStatementDate?: Date;

  @ApiProperty({ description: 'Linked Chart Account Plan Id' })
  @IsNumber()
  @IsNotEmpty()
  linkedChartAccountId: number;

  @ApiProperty({ description: 'Status' })
  @IsBoolean()
  @IsNotEmpty()
  is_active: boolean;
}

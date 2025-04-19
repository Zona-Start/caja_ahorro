import { CurrencyCodeEnum, StatusEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
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

export class CreateAssociateAccountsDto {
  @ApiProperty({ description: 'Associated ID' })
  @IsInt()
  @IsNotEmpty()
  associateId: number;

  @ApiProperty({ description: 'Account number' })
  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @ApiProperty({
    description: 'Currency Code',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
  })
  @IsNotEmpty()
  @IsEnum(CurrencyCodeEnum)
  currencyCode: CurrencyCodeEnum;

  @ApiProperty({ description: 'Initial balance', required: false })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiProperty({ description: 'Opening date', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  openingDate?: Date;

  @ApiProperty({ description: 'Bank ID' })
  @IsInt()
  @IsNotEmpty()
  bankDirectoryId: number;

  @ApiProperty({ description: 'Base salary' })
  @IsInt()
  @IsNotEmpty()
  salary: number;

  @ApiProperty({ description: 'Total salary' })
  @IsInt()
  @IsNotEmpty()
  salaryTotal: number;

  @ApiProperty({
    description: 'Account status',
    enum: StatusEnum,
    enumName: 'StatusEnum',
  })
  @IsEnum(StatusEnum)
  @IsNotEmpty()
  status: StatusEnum;
}

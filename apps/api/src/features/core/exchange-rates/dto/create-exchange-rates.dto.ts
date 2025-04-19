import { CurrencyCodeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExchangeRatesDto {
  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ enum: CurrencyCodeEnum, enumName: 'CurrencyCodeEnum' })
  @IsEnum(CurrencyCodeEnum)
  @IsNotEmpty()
  fromCurrencyCode: CurrencyCodeEnum;

  @ApiProperty({ enum: CurrencyCodeEnum, enumName: 'CurrencyCodeEnum' })
  @IsEnum(CurrencyCodeEnum)
  @IsNotEmpty()
  toCurrencyCode: CurrencyCodeEnum;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  rate: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  source?: string;
}

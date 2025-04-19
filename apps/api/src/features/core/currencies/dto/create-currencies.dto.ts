import { CurrencyCodeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCurrenciesDto {
  @ApiProperty({ enum: CurrencyCodeEnum, enumName: 'CurrencyCodeEnum' })
  @IsEnum(CurrencyCodeEnum)
  @IsNotEmpty()
  code: CurrencyCodeEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  decimal_places: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

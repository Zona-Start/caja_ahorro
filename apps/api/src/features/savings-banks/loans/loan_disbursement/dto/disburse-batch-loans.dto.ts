import { CurrencyCodeEnum } from '@/types/enum';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class DisburseBatchItemDto {
  @IsInt()
  @IsPositive()
  loanId: number;
}

/** DTO para desembolso en lote de múltiples préstamos */
export class DisburseBatchLoansDto {
  @IsInt()
  @IsPositive()
  bankAccountId: number;

  @IsEnum(CurrencyCodeEnum)
  currencyCode: CurrencyCodeEnum;

  @IsDate()
  @Type(() => Date)
  disbursementDate: Date;

  @IsString()
  @IsOptional()
  bankReference?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DisburseBatchItemDto)
  items: DisburseBatchItemDto[];
}

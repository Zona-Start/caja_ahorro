import { CurrencyCodeEnum, paymentMethodEnum } from '@/types/enum';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

/** DTO para desembolso individual de un préstamo */
export class DisburseIndividualLoanDto {
  @IsInt()
  @IsPositive()
  loanId: number;

  @IsInt()
  @IsPositive()
  bankAccountId: number;

  @IsEnum(CurrencyCodeEnum)
  currencyCode: CurrencyCodeEnum;

  @IsEnum(paymentMethodEnum)
  paymentMethod: paymentMethodEnum;

  @IsDate()
  @Type(() => Date)
  disbursementDate: Date;

  @IsString()
  @IsOptional()
  bankReference?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

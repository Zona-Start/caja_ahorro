import { loanPaymetTypeEnum, paymentMethodEnum } from '@/types/enum';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateLoanPaidDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  loanId: number;

  @IsEnum(paymentMethodEnum)
  paymentMethod: paymentMethodEnum;

  @IsEnum(loanPaymetTypeEnum)
  @IsOptional()
  paymentType?: loanPaymetTypeEnum;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  paymentDate: Date; // Fecha de pago

  @IsNumber()
  @IsPositive()
  @IsOptional()
  bankId?: number; // id del banco

  @IsNumber()
  @IsPositive()
  @Min(1)
  @IsNotEmpty()
  amount: number; // Monto de pago

  @IsString()
  @IsOptional()
  transactionReference?: string; // referencia optional

  @IsString()
  @IsOptional()
  comment?: string; // Observaciones
}

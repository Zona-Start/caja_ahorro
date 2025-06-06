import {
  loanModalityTypeEnum,
  LoanStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';
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
} from 'class-validator';

export class CreateLoanDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  associateId: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  loanTypeId: number;

  @IsEnum(loanModalityTypeEnum)
  loanModality: loanModalityTypeEnum;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  requestDate: Date; // Fecha de solicitud

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date; // Fecha de inicio

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  requestedAmount: number; // Monto solicitado

  @IsNumber()
  @IsOptional()
  overdraftAmount?: number; // Sobregiro si aplica

  @IsNumber()
  @IsPositive()
  @IsOptional()
  previousLoanId: number; // Relación con préstamo anterior si existe

  @IsEnum(paymentMethodEnum)
  paymentMethod: paymentMethodEnum;

  @IsInt()
  @IsOptional()
  disbursementAccountId: number;

  @IsEnum(LoanStatusEnum)
  @IsNotEmpty()
  status: LoanStatusEnum;

  @IsString()
  @IsOptional()
  notes?: string; // Observaciones
}

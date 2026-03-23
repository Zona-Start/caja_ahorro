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

  @IsNumber()
  @IsOptional()
  interestRate?: number; // Tasa de interés

  @IsString()
  @IsOptional()
  termType?: string; // Tipo de plazo: "CUOTAS" o "PLAZO" (para indicar si se maneja por número de cuotas o un plazo fijo)

  @IsInt()
  @IsOptional()
  termUnits?: number; // Número de cuotas o duración del plazo)

  @IsNumber()
  @IsOptional()
  expensesPercentage?: number; // Porcentaje de gastos administrativos (sobreescribe el del tipo de préstamo)
}

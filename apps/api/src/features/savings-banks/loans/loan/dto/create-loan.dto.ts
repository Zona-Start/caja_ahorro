import { LoanStatusEnum, paymentMethodEnum } from '@/types/enum';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateLoanDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  associateId: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  companyId: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  loanTypeId: number;

  @IsDateString()
  @IsNotEmpty()
  requestDate: Date; // Fecha de solicitud

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  requestedAmount: number; // Monto solicitado

  @IsInt()
  @IsPositive()
  @Min(1)
  @IsNotEmpty()
  expensesAmount: number; // Monto de gastos administrativo

  @IsNumber()
  @IsPositive()
  @IsOptional()
  overdraftAmount?: number; // Sobregiro si aplica

  @IsNumber()
  @IsPositive()
  @IsOptional()
  previousLoanId: number; // Relación con préstamo anterior si existe

  @IsEnum(paymentMethodEnum)
  paymentMethod: paymentMethodEnum;

  @IsInt()
  @IsPositive()
  @Min(1)
  @IsNotEmpty()
  disbursementAccountId: number;

  @IsEnum(LoanStatusEnum)
  @IsNotEmpty()
  status: LoanStatusEnum;

  @IsString()
  @IsOptional()
  notes?: string; // Observaciones
}

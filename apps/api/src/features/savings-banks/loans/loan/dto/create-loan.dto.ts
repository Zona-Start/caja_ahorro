import { LoanStatusEnum } from '@/types/enum';
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
  amount: number; // Monto solicitado

  @IsInt()
  @IsPositive()
  @Min(1)
  @IsNotEmpty()
  termMonths: number; // Plazo en meses

  @IsNumber()
  @IsPositive()
  @IsOptional()
  interestRate?: number; // Tasa de interés anual (puede ser opcional si se toma de settings)

  @IsEnum(LoanStatusEnum)
  @IsNotEmpty()
  status: LoanStatusEnum;

  @IsDateString()
  @IsNotEmpty()
  requestDate: string; // Fecha de solicitud

  @IsString()
  @IsOptional()
  purpose?: string; // Propósito del préstamo

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  createdById: number; // ID del usuario que crea el registro
}

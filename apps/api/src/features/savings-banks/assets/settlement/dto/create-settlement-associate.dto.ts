import { paymentMethodEnum } from '@/types/enum';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSettlementAssociateDto {
  @IsInt()
  @Min(1) // Asume que los IDs son positivos
  @IsNotEmpty()
  associateId: number;

  @IsOptional()
  @IsDate()
  @IsNotEmpty()
  liquidationDate?: Date; // Puedes recibirla como string ISO 8601 o Date si ya la transformas

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0) // Los saldos no deberían ser negativos en este contexto (aunque la liquidación neta sí podría)
  @Type(() => Number) // Asegura que el valor se transforme a Number si viene como string
  @IsNotEmpty()
  totalSavingsBalanceAtLiquidation: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Type(() => Number)
  @IsNotEmpty()
  totalOutstandingLoansAtLiquidation: number; // Puede ser 0 o positivo

  @IsNumber({ maxDecimalPlaces: 4 })
  @Type(() => Number)
  @IsNotEmpty()
  totalOutstandingCreditsAtLiquidation: number; // Puede ser 0 o positivo

  @IsNumber({ maxDecimalPlaces: 4 })
  @Type(() => Number)
  @IsNotEmpty()
  netLiquidationAmount: number; // Puede ser positivo (a favor) o negativo (a deber)

  @IsOptional()
  @IsString()
  notes?: string;

  @IsEnum(paymentMethodEnum) // Usa tu enum de TypeScript para la validación
  @IsNotEmpty()
  paymentMethod: paymentMethodEnum;

  @IsArray()
  @IsOptional()
  beneficiary: Beneficiary[] | null; // Puedes definir un DTO específico para el beneficiario si es necesario
}

export class Beneficiary {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsNotEmpty()
  cedula: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string; // Add min length

  @IsInt()
  @IsNotEmpty()
  bankDirectoryId: number;
}

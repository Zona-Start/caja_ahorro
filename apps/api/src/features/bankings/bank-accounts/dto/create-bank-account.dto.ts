import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({
    description: 'ID de la compañía propietaria de la cuenta bancaria',
  })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @ApiProperty({
    description: 'ID del banco al que pertenece la cuenta bancaria',
  })
  @IsNotEmpty()
  @IsNumber()
  bankDirectoryId: number;

  @ApiProperty({ description: 'Número de cuenta bancaria completo' })
  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Nombre de la cuenta bancaria', required: false })
  @IsString()
  @IsOptional()
  accountName?: string;

  @ApiProperty({
    description: 'Tipo de cuenta bancaria (Ej: Corriente, Ahorro)',
  })
  @IsNotEmpty()
  @IsString()
  accountType: string;

  @ApiProperty({ description: 'Código de moneda de la cuenta bancaria' })
  @IsNotEmpty()
  @IsNumber()
  currencyCode: number;

  @ApiProperty({ description: 'Fecha de apertura de la cuenta bancaria' })
  @IsDate()
  @IsOptional()
  openingDate?: Date;

  @ApiProperty({ description: 'Saldo inicial de la cuenta bancaria' })
  @IsNumber()
  @IsOptional()
  currentBalance?: number;

  @ApiProperty({ description: 'ID de la cuenta contable vinculada' })
  @IsNotEmpty()
  @IsNumber()
  linkedChartAccountId: number;

  @ApiProperty({ description: 'Estado activo de la cuenta bancaria' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'ID de la regla contable para el asiento de apertura',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  accountingRuleId?: number;

  @ApiProperty({
    description: 'Indica si se debe generar el asiento de apertura',
  })
  @IsBoolean()
  @IsOptional()
  openingEntryPosted?: boolean;
}

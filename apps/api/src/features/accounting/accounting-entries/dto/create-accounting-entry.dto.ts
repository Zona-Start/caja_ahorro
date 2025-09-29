import { CurrencyCodeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateAccountingEntryDetailDto } from './create-accounting-entry-detail.dto';

export class CreateAccountingEntryDto {
  @ApiProperty({ description: 'ID de la compañía' })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'ID del ciclo contable al que pertenece el asiento',
  })
  @IsInt()
  @IsNotEmpty()
  accountingCycleId: number;

  @ApiProperty({ description: 'Fecha contable del asiento' })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  entryDate: Date;

  @ApiProperty({ description: 'Descripción general del asiento' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    required: false,
    description: 'ID de referencia de la operación origen (ej: loan_id)',
  })
  @IsOptional()
  @IsString()
  originReferenceId?: string;

  @ApiProperty({
    required: false,
    description: 'Tipo de operación origen (ej: LOAN_DISBURSEMENT)',
  })
  @IsOptional()
  @IsString()
  originType?: string;

  @ApiProperty({
    enum: CurrencyCodeEnum,
    description: 'Código de la moneda del asiento',
  })
  @IsEnum(CurrencyCodeEnum)
  @IsNotEmpty()
  currencyCode: CurrencyCodeEnum;

  @ApiProperty({
    type: () => [CreateAccountingEntryDetailDto],
    description: 'Detalles del asiento contable',
  })
  @ArrayMinSize(2, {
    message:
      'Un asiento contable debe tener al menos dos detalles (débito y crédito)',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateAccountingEntryDetailDto)
  details: CreateAccountingEntryDetailDto[];
}

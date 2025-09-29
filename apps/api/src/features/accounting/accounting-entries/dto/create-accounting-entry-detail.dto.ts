import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAccountingEntryDetailDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  accountPlanId: number;

  @ApiProperty({
    type: 'string',
    format: 'float',
    description: 'Monto del débito, debe ser 0 si hay crédito',
  })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsNumber()
  @Type(() => Number)
  debit: number;

  @ApiProperty({
    type: 'string',
    format: 'float',
    description: 'Monto del crédito, debe ser 0 si hay débito',
  })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsNumber()
  @Type(() => Number)
  credit: number;

  @ApiProperty({
    required: false,
    description: 'Descripción del detalle del asiento',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

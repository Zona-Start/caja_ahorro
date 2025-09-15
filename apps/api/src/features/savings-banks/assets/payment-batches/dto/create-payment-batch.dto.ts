import { CurrencyCodeEnum, paymentBatchItemType } from '@/types/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePaymentBatchItemDto {
  @IsEnum(paymentBatchItemType)
  @IsNotEmpty()
  type: paymentBatchItemType;

  @ApiProperty({ description: 'ID del préstamo, retiro o liquidación' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  sourceId: number;
}

export class CreatePaymentBatchDto {
  @ApiProperty({
    description: 'Cuenta bancaria desde la que se girará el dinero',
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  bankAccountId: number;

  @ApiProperty({
    description: 'Moneda de los desembolsos',
    enum: () => CurrencyCodeEnum,
  })
  @IsEnum(CurrencyCodeEnum)
  @IsNotEmpty()
  currencyCode: CurrencyCodeEnum;

  @ApiPropertyOptional({ description: 'Descripción interna del lote' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Indica si el lote se procesará manualmente (sin archivo TXT)' })
  @IsBoolean()
  @IsOptional()
  isManual?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentBatchItemDto)
  items: CreatePaymentBatchItemDto[];
}

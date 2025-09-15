import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class ItemResultDto {
  @IsNumber() // ✅ Agrega el decorador de validación
  @ApiProperty()
  itemId: number;

  @IsString()
  @IsIn(['PROCESSED', 'REJECTED']) // ✅ Agrega la validación de valor
  @ApiProperty({ enum: ['PROCESSED', 'REJECTED'] })
  status: 'PROCESSED' | 'REJECTED';

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  reason?: string;
}

export class ConfirmPaymentBatchDto {
  @ApiPropertyOptional({ description: 'Referencia devuelta por el banco' })
  @IsString()
  @IsOptional()
  bankReference?: string;

  @ApiProperty({ description: 'Fecha en que el banco procesó el lote' })
  @IsDateString()
  processedAt: string; // ISO-8601

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemResultDto)
  items: ItemResultDto[];
}

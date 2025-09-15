import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class ItemResultDto {
  @ApiProperty()
  itemId: number;

  @ApiProperty({ enum: ['PROCESSED', 'REJECTED'] })
  status: 'PROCESSED' | 'REJECTED';

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

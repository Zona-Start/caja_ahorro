import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FindAllForInvoiceDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  supplierId: number;

  @ApiPropertyOptional({
    description: 'Status (can be a single status or comma-separated)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  status?: string[];
}

import { invoiceSuppliersStatusEnum } from '@/types/enum';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterInvoiceDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de proveedor',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  supplierId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por número de factura',
    example: 'INV-2023-001',
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por fecha de factura (inicio)',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  invoiceDateStart?: Date;

  @ApiPropertyOptional({
    description: 'Filtrar por fecha de factura (fin)',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  invoiceDateEnd?: Date;

  @ApiPropertyOptional({
    description: 'Filtrar por fecha de vencimiento (inicio)',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDateStart?: Date;

  @ApiPropertyOptional({
    description: 'Filtrar por fecha de vencimiento (fin)',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDateEnd?: Date;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de la factura',
    enum: invoiceSuppliersStatusEnum,
  })
  @IsOptional()
  @IsEnum(invoiceSuppliersStatusEnum)
  status?: invoiceSuppliersStatusEnum;
}

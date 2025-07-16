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

export class FilterPurchaseOrderDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de proveedor',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  supplierId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por número de factura',
    example: 'PO-2023-001',
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por fecha de compra (inicio)',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  purchaseDateStart?: Date;

  @ApiPropertyOptional({
    description: 'Filtrar por fecha de compra (fin)',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  purchaseDateEnd?: Date;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de la orden de compra',
    enum: invoiceSuppliersStatusEnum,
  })
  @IsOptional()
  @IsEnum(invoiceSuppliersStatusEnum)
  status?: invoiceSuppliersStatusEnum;
}

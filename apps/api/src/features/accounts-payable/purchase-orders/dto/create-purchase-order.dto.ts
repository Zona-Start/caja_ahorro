import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyCodeEnum, InvoiceSuppliersStatusEnum } from '@/types/enum';
import { CreatePurchaseItemDto } from './create-purchase-item.dto';

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'ID del proveedor', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  supplierId: number;

  @ApiProperty({ description: 'Número de factura del proveedor', example: 'PO-2023-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invoiceNumber: string;

  @ApiProperty({ description: 'Fecha de la compra', example: '2023-01-15' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  purchaseDate: Date;

  @ApiProperty({ description: 'Monto total de la compra', example: 5000.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  totalAmount: number;

  @ApiProperty({ description: 'Código de la moneda', enum: CurrencyCodeEnum, example: CurrencyCodeEnum.USD })
  @IsEnum(CurrencyCodeEnum)
  @IsNotEmpty()
  currencyCode: CurrencyCodeEnum;

  @ApiProperty({ description: 'ID de la cuenta por pagar asociada (si es a crédito)', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  payableId?: number;

  @ApiProperty({ description: 'Estado de la orden de compra', enum: InvoiceSuppliersStatusEnum, example: InvoiceSuppliersStatusEnum.PENDING, required: false })
  @IsEnum(InvoiceSuppliersStatusEnum)
  @IsOptional()
  status?: InvoiceSuppliersStatusEnum;

  @ApiProperty({ description: 'Descripción de la orden de compra', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: () => [CreatePurchaseItemDto], description: 'Lista de ítems de la orden de compra' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}
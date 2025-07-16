import { invoiceSuppliersStatusEnum, purchaseTypeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreatePurchaseItemDto } from './create-purchase-item.dto';

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'ID del proveedor', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  supplierId: number;

  @ApiProperty({
    description: 'Número de factura del proveedor',
    example: 'PO-2023-001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invoiceNumber: string;

  @ApiProperty({ description: 'Fecha de la compra', example: '2023-01-15' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  purchaseDate: Date;

  @ApiProperty({ description: 'Monto total de la compra', example: 5000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  totalAmount: number;

  @ApiProperty({
    description: 'Tipo Compra',
    enum: purchaseTypeEnum,
    example: purchaseTypeEnum.CASH,
    required: true,
  })
  @IsEnum(purchaseTypeEnum)
  @IsNotEmpty()
  purchaseType: purchaseTypeEnum;

  // @ApiProperty({
  //   description: 'Código de la moneda',
  //   enum: CurrencyCodeEnum,
  //   example: CurrencyCodeEnum.USD,
  // })
  // @IsEnum(CurrencyCodeEnum)
  // @IsNotEmpty()
  // currencyCode: CurrencyCodeEnum;

  @ApiProperty({
    description: 'ID de la cuenta por pagar asociada (si es a crédito)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  payableId?: number;

  @ApiProperty({
    description: 'Estado de la orden de compra',
    enum: invoiceSuppliersStatusEnum,
    example: invoiceSuppliersStatusEnum.PENDING,
    required: false,
  })
  @IsEnum(invoiceSuppliersStatusEnum)
  @IsOptional()
  status?: invoiceSuppliersStatusEnum;

  @ApiProperty({
    description: 'Descripción de la orden de compra',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: () => [CreatePurchaseItemDto],
    description: 'Lista de ítems de la orden de compra',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}

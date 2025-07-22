import {
  invoiceSuppliersStatusEnum,
  purchaseOrderTypeEnum,
  supplierInvoicesPaymentEnum,
} from '@/database/schema/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class SupplierInvoiceItemDto {
  @ApiProperty({ description: 'Line type' })
  @IsEnum(purchaseOrderTypeEnum.enumValues)
  @IsNotEmpty()
  lineType: (typeof purchaseOrderTypeEnum.enumValues)[number];

  @ApiPropertyOptional({ description: 'Product ID' })
  @IsInt()
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({ description: 'Fixed Asset ID' })
  @IsInt()
  @IsOptional()
  fixedAssetId?: number;

  @ApiPropertyOptional({ description: 'Expense Account ID' })
  @IsInt()
  @IsOptional()
  expenseAccountId?: number;

  @ApiProperty({ description: 'Description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Quantity' })
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ description: 'Unit cost' })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsNotEmpty()
  unitCost: number;

  @ApiProperty({ description: 'Total line' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  totalLine: number;
}

export class CreateSupplierInvoiceDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @ApiPropertyOptional({ description: 'Purchase Order ID' })
  @IsInt()
  @IsOptional()
  purchaseOrderId?: number;

  @ApiProperty({ description: 'Invoice number' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiPropertyOptional({ description: 'Control number' })
  @IsString()
  @IsOptional()
  controlNumber?: string;

  @ApiProperty({ description: 'Invoice date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  invoiceDate: Date;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @ApiProperty({ description: 'Subtotal' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  subtotal: number;

  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  taxAmount?: number;

  @ApiProperty({ description: 'Total amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  totalAmount: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  @IsNotEmpty()
  currencyCode: string;

  @ApiPropertyOptional({
    description: 'Payment type',
    enum: supplierInvoicesPaymentEnum.enumValues,
  })
  @IsEnum(supplierInvoicesPaymentEnum.enumValues)
  @IsOptional()
  paymentType?: (typeof supplierInvoicesPaymentEnum.enumValues)[number];

  @ApiPropertyOptional({ description: 'Status', enum: invoiceSuppliersStatusEnum.enumValues })
  @IsEnum(invoiceSuppliersStatusEnum.enumValues)
  @IsOptional()
  status?: (typeof invoiceSuppliersStatusEnum.enumValues)[number];

  @ApiPropertyOptional({ description: 'Observations' })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiProperty({ type: () => [SupplierInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierInvoiceItemDto)
  items: SupplierInvoiceItemDto[];
}

import {
  purchaseOrderStatusEnum,
  purchaseOrderTypeEnum,
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

class PurchaseOrderItemDto {
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

  @ApiProperty({ description: 'Item name' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

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

  @ApiProperty({ description: 'Total cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  totalCost: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @ApiProperty({ description: 'Order number' })
  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @ApiProperty({ description: 'Order type', enum: purchaseOrderTypeEnum.enumValues })
  @IsEnum(purchaseOrderTypeEnum.enumValues)
  @IsNotEmpty()
  orderType: (typeof purchaseOrderTypeEnum.enumValues)[number];

  @ApiPropertyOptional({ description: 'Status', enum: purchaseOrderStatusEnum.enumValues })
  @IsEnum(purchaseOrderStatusEnum.enumValues)
  @IsOptional()
  status?: (typeof purchaseOrderStatusEnum.enumValues)[number];

  @ApiProperty({ description: 'Order date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  orderDate: Date;

  @ApiPropertyOptional({ description: 'Expected delivery date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expectedDeliveryDate?: Date;

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

  @ApiPropertyOptional({ description: 'Observations' })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiProperty({ type: () => [PurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

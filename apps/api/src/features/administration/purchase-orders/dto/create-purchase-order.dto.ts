import {
  purchaseOrderStatusEnum,
  purchaseOrderTypeEnum,
} from '@/database/schema/enum/enum';
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
  @ApiProperty({ description: 'Item ID' })
  @IsInt()
  @IsOptional()
  id: number;

  @ApiProperty({ description: 'Line type' })
  @IsEnum(purchaseOrderTypeEnum.enumValues)
  @IsNotEmpty()
  lineType: (typeof purchaseOrderTypeEnum.enumValues)[number];

  @ApiPropertyOptional({ description: 'Product ID' })
  @IsInt()
  @IsOptional()
  itemId?: number;

  @ApiProperty({ description: 'Description' })
  @IsString()
  @IsOptional()
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
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsOptional()
  totalCost: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @ApiPropertyOptional({
    description: 'Status',
    enum: purchaseOrderStatusEnum.enumValues,
  })
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
  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @ApiProperty({ description: 'Total amount' })
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

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

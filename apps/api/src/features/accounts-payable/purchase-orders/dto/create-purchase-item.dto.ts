import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PurchaseItemTypeEnum } from '@/types/enum';

export class CreatePurchaseItemDto {
  @ApiProperty({ description: 'Tipo de ítem', enum: PurchaseItemTypeEnum, example: PurchaseItemTypeEnum.SALES_INVENTORY })
  @IsEnum(PurchaseItemTypeEnum)
  @IsNotEmpty()
  itemType: PurchaseItemTypeEnum;

  @ApiProperty({ description: 'Nombre del ítem', example: 'Laptop Dell' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ description: 'Cantidad', example: 5 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ description: 'Costo unitario', example: 1200.50 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  @IsNotEmpty()
  unitCost: number;

  @ApiProperty({ description: 'Costo total', example: 6002.50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  totalCost: number;

  @ApiProperty({ description: 'ID del producto de venta (si aplica)', example: 1, required: false })
  @IsInt()
  @IsOptional()
  salesProductId?: number;

  @ApiProperty({ description: 'ID del activo fijo (si aplica)', example: 1, required: false })
  @IsInt()
  @IsOptional()
  fixedAssetId?: number;
}

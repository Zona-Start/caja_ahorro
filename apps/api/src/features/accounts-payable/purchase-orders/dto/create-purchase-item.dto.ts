import { purchaseItemTypeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePurchaseItemDto {
  @ApiProperty({ description: 'ID del producto', example: 1 })
  @IsNumber()
  @IsOptional()
  id: number;

  @ApiProperty({
    description: 'Tipo de ítem',
    enum: purchaseItemTypeEnum,
    example: purchaseItemTypeEnum.SALES_INVENTORY,
  })
  @IsEnum(purchaseItemTypeEnum)
  @IsNotEmpty()
  itemType: purchaseItemTypeEnum;

  @ApiProperty({ description: 'Nombre del ítem', example: 'Laptop Dell' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ description: 'Cantidad', example: 5 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ description: 'Costo unitario', example: 1200.5 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  @IsNotEmpty()
  unitCost: number;

  @ApiProperty({ description: 'Costo total', example: 6002.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  totalCost: number;

  @ApiProperty({
    description: 'ID del producto de venta (si aplica)',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  salesProductId?: number;

  @ApiProperty({
    description: 'ID del activo fijo (si aplica)',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  fixedAssetId?: number;
}

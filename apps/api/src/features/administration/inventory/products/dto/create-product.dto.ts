import { productStatus } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({ example: 'Refrigerador 250L' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'Refrigerador de 250 litros con dispensador de agua.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Samsung' })
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 'RT250K' })
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @IsNotEmpty()
  stockMin: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsNotEmpty()
  stockMax: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsNotEmpty()
  reorderPoint: number;

  @ApiProperty({ enum: productStatus, enumName: 'ProductStatus' })
  @IsEnum(productStatus)
  @IsOptional()
  status?: productStatus;

  @ApiProperty({ description: 'Supplier Cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  supplierCost: number;

  @ApiProperty({ description: 'Other Cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  otherCosts: number;

  @ApiProperty({ description: 'Profit Sale' })
  @IsNumber()
  @IsOptional()
  profitSale?: number;

  @ApiProperty({ description: 'Profit Supply' })
  @IsNumber()
  @IsOptional()
  profitSupply?: number;

  @ApiProperty({ description: 'Purchase Tax' })
  @IsNumber()
  @IsOptional()
  purchaseTax?: number;

  @ApiProperty({ description: 'Sale Tax' })
  @IsNumber()
  @IsOptional()
  saleTax?: number;

  @ApiProperty({ example: 'Unit Type' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  unitType?: string;
}

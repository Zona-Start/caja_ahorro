import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSalesProductDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  categoryId: number;

  @ApiProperty({ example: 'REF001' })
  @IsString()
  @MaxLength(50)
  productCode: string;

  @ApiProperty({ example: 'Refrigerador 250L' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Refrigerador de 250 litros con dispensador de agua.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Samsung' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: 'RT250K' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 1500.0 })
  @IsNumber()
  defaultPurchaseCost: number;

  @ApiProperty({ example: 2000.0 })
  @IsNumber()
  defaultSellingPrice: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @IsOptional()
  currentStock?: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsOptional()
  minimumStockAlert?: number;

  @ApiProperty({ example: 'ACTIVO' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  status?: string;
}
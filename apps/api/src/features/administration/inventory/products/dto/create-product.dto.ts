import { priceTypeEnum } from '@/database/schema/enum';
import { productStatus } from '@/types/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: 'RT250K' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @IsOptional()
  stockMin?: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsOptional()
  stockMax?: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsOptional()
  reorderPoint?: number;

  @ApiProperty({ enum: productStatus, enumName: 'ProductStatus' })
  @IsEnum(productStatus)
  @IsOptional()
  status?: productStatus;

  @ApiProperty({ description: 'Price' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({
    description: 'Price type',
    enum: priceTypeEnum.enumValues,
  })
  @IsEnum(priceTypeEnum.enumValues)
  @IsOptional()
  priceType?: (typeof priceTypeEnum.enumValues)[number];
}

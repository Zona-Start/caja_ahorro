import { priceTypeEnum } from '@/database/schema/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateProductPriceDto {
  @ApiProperty({ description: 'Product ID' })
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsInt()
  @IsOptional()
  suppliersId?: number;

  @ApiProperty({ description: 'Price type', enum: priceTypeEnum.enumValues })
  @IsEnum(priceTypeEnum.enumValues)
  @IsNotEmpty()
  priceType: (typeof priceTypeEnum.enumValues)[number];

  @ApiProperty({ description: 'Base Cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  baseCost: number; //costo base

  @ApiProperty({ description: 'Other Costs' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  otherCosts: number; //otro costo si aplica

  @ApiProperty({ description: 'Purchase Tax' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  purchaseTax?: number; //impuesto compra en porcentaje

  @ApiProperty({ description: 'Purchase Tax' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  saleTax?: number; ////impuesto venta en porcentaje

  @ApiProperty({ description: 'Profit Percent' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  profitPercent?: number; //utilidad en porcentaje

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

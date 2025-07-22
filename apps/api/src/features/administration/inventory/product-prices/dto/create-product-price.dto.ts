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

  @ApiProperty({ description: 'Price' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  price: number;

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

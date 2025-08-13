import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateFixedAssetPriceDto {
  @ApiProperty({ description: 'Fixed Asset ID' })
  @IsInt()
  @IsNotEmpty()
  fixedAssetsId: number;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsInt()
  @IsOptional()
  suppliersId?: number;

  @ApiProperty({ description: 'Base Cost' })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsNotEmpty()
  baseCost: number;

  @ApiProperty({ description: 'Other Costs' })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsNotEmpty()
  otherCosts: number;

  @ApiProperty({ description: 'Purchase Tax' })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsNotEmpty()
  purchaseTax: number;

  @ApiProperty({ description: 'Total Cost' })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsNotEmpty()
  totalCost: number;

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

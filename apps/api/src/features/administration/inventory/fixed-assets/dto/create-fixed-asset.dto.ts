import { fixedAssetsInventoryStatus } from '@/types/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFixedAssetDto {
  @ApiProperty({ description: 'Category ID' })
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({ description: 'Asset code' })
  @IsString()
  @IsOptional()
  assetCode: string;

  @ApiProperty({ description: 'Asset name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Asset description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Serial number' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Model' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Brand' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ description: 'Acquisition date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  acquisitionDate: Date;

  @ApiPropertyOptional({
    description: 'Asset status',
    enum: fixedAssetsInventoryStatus,
    default: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(fixedAssetsInventoryStatus)
  assetStatus?: fixedAssetsInventoryStatus;

  @ApiPropertyOptional({ description: 'Useful life in years' })
  @IsOptional()
  @IsInt()
  @Min(0)
  usefulLifeYears?: number;

  @ApiPropertyOptional({ description: 'Depreciation method' })
  @IsOptional()
  @IsString()
  depreciationMethod?: string;

  @ApiPropertyOptional({ description: 'Accumulated depreciation' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  accumulatedDepreciation?: number;

  @ApiPropertyOptional({ description: 'Last depreciation date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastDepreciationDate?: Date;

  @ApiPropertyOptional({ description: 'Disposal date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  disposalDate?: Date;

  @ApiPropertyOptional({ description: 'Disposal reason' })
  @IsOptional()
  @IsString()
  disposalReason?: string;

  @ApiPropertyOptional({ description: 'Disposal value' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  disposalValue?: number;

  @ApiProperty({ description: 'Supplier Cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  baseCost: number;

  @ApiProperty({ description: 'Other Cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  otherCosts: number;

  @ApiProperty({ description: 'Purchase Tax' })
  @IsNumber()
  @IsOptional()
  purchaseTax?: number;
}

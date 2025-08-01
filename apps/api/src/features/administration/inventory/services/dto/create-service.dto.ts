import { StatusEnum } from '@/types/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ description: 'Service name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Service description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Category ID' })
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @ApiPropertyOptional({
    description: 'Status',
    enum: StatusEnum,
    default: StatusEnum.ACTIVE,
  })
  @IsString()
  @IsOptional()
  status?: StatusEnum;

  @ApiProperty({ description: 'Supplier Cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  supplierCost: number;

  @ApiProperty({ description: 'Other Cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  otherCosts: number;

  @ApiProperty({ description: 'Purchase Tax' })
  @IsNumber()
  @IsOptional()
  purchaseTax?: number;
}

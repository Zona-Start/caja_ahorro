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

export class CreateServicePriceDto {
  @ApiProperty({ description: 'Service ID' })
  @IsInt()
  @IsNotEmpty()
  serviceId: number;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsInt()
  @IsOptional()
  suppliersId?: number;

  @ApiProperty({ description: 'Base Cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  baseCost: number;

  @ApiProperty({ description: 'Other Costs' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  otherCosts: number;

  @ApiProperty({ description: 'Purchase Tax' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  purchaseTax: number;

  @ApiProperty({ description: 'Total Cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
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

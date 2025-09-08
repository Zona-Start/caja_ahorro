import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class FilterSupplierPaymentDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term for payment number' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Field to sort by', default: 'id' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'id';

  @ApiPropertyOptional({ description: 'Sort order', default: 'asc' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ description: 'Filter by supplier IDs' })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  @IsOptional()
  supplierIds?: number[];

  @ApiPropertyOptional({ description: 'Filter by payment status' })
  @IsString()
  @IsOptional()
  status?: string; // Should be payment status enum

  @ApiPropertyOptional({ description: 'Start date for transaction date filter' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date for transaction date filter' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;
}
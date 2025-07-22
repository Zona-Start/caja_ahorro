import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterProductPriceDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Product ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  productId?: number;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  suppliersId?: number;

  @ApiPropertyOptional({ description: 'Price type' })
  @IsOptional()
  @IsString()
  priceType?: string;
}

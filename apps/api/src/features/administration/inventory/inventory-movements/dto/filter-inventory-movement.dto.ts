import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterInventoryMovementDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Product ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  productId?: number;

  @ApiPropertyOptional({ description: 'Movement type' })
  @IsOptional()
  @IsString()
  movementType?: string;

  @ApiPropertyOptional({ description: 'Document type' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ description: 'Document number' })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}

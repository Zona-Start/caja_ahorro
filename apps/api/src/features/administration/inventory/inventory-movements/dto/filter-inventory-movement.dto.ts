import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterInventoryMovementDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Item ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  itemId?: number;

  @ApiPropertyOptional({
    description: 'Item type',
    enum: ['PRODUCT', 'FIXED_ASSET'],
  })
  @IsOptional()
  @IsIn(['PRODUCT', 'FIXED_ASSET'])
  @IsString()
  itemType?: 'PRODUCT' | 'FIXED_ASSET';

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
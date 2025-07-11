import { categorySuppliers, statusSuppliers } from '@/types/enum';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterSupplierDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Filtrar por nombre del proveedor' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filtrar por identificación fiscal' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por categoría',
    enum: categorySuppliers,
  })
  @IsOptional()
  @IsEnum(categorySuppliers)
  category?: categorySuppliers;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: statusSuppliers,
  })
  @IsOptional()
  @IsEnum(statusSuppliers)
  status?: statusSuppliers;
}
